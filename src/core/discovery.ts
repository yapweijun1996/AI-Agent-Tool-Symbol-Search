import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import ignore from "ignore";
import { minimatch } from "minimatch";
import type { Diagnostic, DiscoveryPatterns, ResourceLimits, Truncation } from "../types";
import { isSecretLike, repositoryRelative, type RootInfo } from "./paths";

export interface DiscoveredFile {
  absolutePath: string;
  relativePath: string;
  size: number;
}

export interface DiscoveryOptions extends DiscoveryPatterns {
  extensions: readonly string[];
  limits: ResourceLimits;
  deadline?: number;
}

export interface DiscoveryResult {
  files: DiscoveredFile[];
  diagnostics: Diagnostic[];
  truncation: Truncation;
  filesScanned: number;
  bytesParsed: number;
}

const DEFAULT_IGNORED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".cache",
  "vendor",
  "generated"
]);

function diagnostic(code: Diagnostic["code"], message: string, severity: Diagnostic["severity"], path?: string, details?: Record<string, unknown>): Diagnostic {
  return { code, message, severity, ...(path ? { path } : {}), ...(details ? { details } : {}) };
}

function normalizePattern(pattern: string): string {
  return pattern.replaceAll("\\", "/").replace(/^\/+/, "");
}

function patternMatches(pattern: string, relativePath: string): boolean {
  const normalizedPattern = normalizePattern(pattern);
  const normalizedPath = relativePath.replaceAll("\\", "/").replace(/^\/+/, "");
  const candidates = [normalizedPath, `${normalizedPath}/placeholder`];
  if (!normalizedPattern.includes("/")) {
    candidates.push(basename(normalizedPath));
  }
  return candidates.some((candidate) => minimatch(candidate, normalizedPattern, { dot: true, nocase: false }));
}

function anyPatternMatches(patterns: readonly string[] | undefined, relativePath: string): boolean {
  return (patterns ?? []).some((pattern) => patternMatches(pattern, relativePath));
}

function globPrefixCanReachDirectory(
  patternSegments: readonly string[],
  directorySegments: readonly string[],
  patternIndex = 0,
  directoryIndex = 0,
  memo = new Map<string, boolean>()
): boolean {
  const key = `${patternIndex}:${directoryIndex}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  let result: boolean;
  if (directoryIndex >= directorySegments.length) {
    result = true;
  } else if (patternIndex >= patternSegments.length) {
    result = false;
  } else {
    const patternSegment = patternSegments[patternIndex];
    if (patternSegment === "**") {
      result = globPrefixCanReachDirectory(patternSegments, directorySegments, patternIndex + 1, directoryIndex, memo)
        || globPrefixCanReachDirectory(patternSegments, directorySegments, patternIndex, directoryIndex + 1, memo);
    } else if (!minimatch(directorySegments[directoryIndex], patternSegment, { dot: true, nocase: false })) {
      result = false;
    } else {
      result = globPrefixCanReachDirectory(patternSegments, directorySegments, patternIndex + 1, directoryIndex + 1, memo);
    }
  }
  memo.set(key, result);
  return result;
}

function includeMayReachDirectory(patterns: readonly string[] | undefined, relativePath: string): boolean {
  if (!patterns || patterns.length === 0) {
    return false;
  }
  const directory = relativePath.replaceAll("\\", "/").replace(/^\/+/, "");
  const directorySegments = directory.split("/").filter(Boolean);
  return patterns.some((pattern) => {
    const normalized = normalizePattern(pattern);
    if (!normalized.includes("/")) {
      return true;
    }
    return globPrefixCanReachDirectory(normalized.split("/").filter(Boolean), directorySegments);
  });
}

function hasAllowedExtension(relativePath: string, extensions: readonly string[]): boolean {
  const lower = relativePath.toLowerCase();
  return extensions.some((extension) => lower.endsWith(extension.toLowerCase()));
}

function loadGitignore(root: RootInfo, diagnostics: Diagnostic[]): ReturnType<typeof ignore> {
  const matcher = ignore();
  try {
    const path = join(root.absolute, ".gitignore");
    const content = readFileSync(path, "utf8");
    matcher.add(content.split(/\r?\n/));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      diagnostics.push(diagnostic("PARSE_ERROR", `Unable to read .gitignore: ${error instanceof Error ? error.message : String(error)}`, "warning", ".gitignore"));
    }
  }
  return matcher;
}

function isGitignored(matcher: ReturnType<typeof ignore>, relativePath: string, directory: boolean): boolean {
  const value = directory ? `${relativePath}/` : relativePath;
  return matcher.ignores(value);
}

function shouldSkipDirectory(relativePath: string, name: string, options: DiscoveryOptions, matcher: ReturnType<typeof ignore>): boolean {
  if (name === ".git" || name === "node_modules") {
    return true;
  }
  if (anyPatternMatches(options.exclude, relativePath)) {
    return true;
  }
  if (options.include && options.include.length > 0) {
    return !includeMayReachDirectory(options.include, relativePath);
  }
  return DEFAULT_IGNORED_DIRECTORIES.has(name) || isGitignored(matcher, relativePath, true);
}

function shouldSkipFile(relativePath: string, options: DiscoveryOptions, matcher: ReturnType<typeof ignore>): boolean {
  if (isSecretLike(relativePath)) {
    return true;
  }
  if (anyPatternMatches(options.exclude, relativePath)) {
    return true;
  }
  if (options.include && options.include.length > 0) {
    return !anyPatternMatches(options.include, relativePath);
  }
  return isGitignored(matcher, relativePath, false);
}

function uniquePushReason(truncation: Truncation, reason: Diagnostic["code"]): void {
  truncation.truncated = true;
  if (!truncation.reasons.includes(reason)) {
    truncation.reasons.push(reason);
  }
}

export function discoverFiles(root: RootInfo, options: DiscoveryOptions): DiscoveryResult {
  const diagnostics: Diagnostic[] = [];
  const truncation: Truncation = { truncated: false, reasons: [] };
  const files: DiscoveredFile[] = [];
  const matcher = loadGitignore(root, diagnostics);
  let bytesParsed = 0;
  let timedOut = false;

  const visit = (directory: string): void => {
    if (timedOut || truncation.reasons.includes("MAX_FILES_REACHED") || truncation.reasons.includes("MAX_BYTES_REACHED")) {
      return;
    }
    if (options.deadline !== undefined && Date.now() >= options.deadline) {
      timedOut = true;
      uniquePushReason(truncation, "TIMEOUT");
      return;
    }

    let entries;
    try {
      entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
    } catch (error) {
      diagnostics.push(diagnostic("PARSE_ERROR", `Unable to read directory: ${error instanceof Error ? error.message : String(error)}`, "warning", repositoryRelative(root.absolute, directory)));
      return;
    }

    for (const entry of entries) {
      if (timedOut || truncation.reasons.includes("MAX_FILES_REACHED") || truncation.reasons.includes("MAX_BYTES_REACHED")) {
        return;
      }
      if (options.deadline !== undefined && Date.now() >= options.deadline) {
        timedOut = true;
        uniquePushReason(truncation, "TIMEOUT");
        return;
      }

      const absolutePath = join(directory, entry.name);
      const relativePath = repositoryRelative(root.absolute, absolutePath);
      if (!relativePath || relativePath.startsWith("../")) {
        continue;
      }
      if (entry.isSymbolicLink()) {
        continue;
      }
      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(relativePath, entry.name, options, matcher)) {
          visit(absolutePath);
        }
        continue;
      }
      if (!entry.isFile() || !hasAllowedExtension(relativePath, options.extensions) || shouldSkipFile(relativePath, options, matcher)) {
        continue;
      }

      let size: number;
      try {
        size = statSync(absolutePath).size;
      } catch (error) {
        diagnostics.push(diagnostic("PARSE_ERROR", `Unable to stat file: ${error instanceof Error ? error.message : String(error)}`, "warning", relativePath));
        continue;
      }
      if (files.length >= options.limits.maxFiles) {
        diagnostics.push(diagnostic("MAX_FILES_REACHED", `Maximum file limit (${options.limits.maxFiles}) reached`, "warning", relativePath));
        uniquePushReason(truncation, "MAX_FILES_REACHED");
        return;
      }
      if (size > options.limits.maxSingleFileBytes) {
        diagnostics.push(diagnostic("MAX_BYTES_REACHED", `File exceeds the maximum size of ${options.limits.maxSingleFileBytes} bytes`, "warning", relativePath, { size }));
        uniquePushReason(truncation, "MAX_BYTES_REACHED");
        continue;
      }
      if (bytesParsed + size > options.limits.maxParsedBytes) {
        diagnostics.push(diagnostic("MAX_BYTES_REACHED", `Parsed byte limit (${options.limits.maxParsedBytes}) would be exceeded`, "warning", relativePath, { size }));
        uniquePushReason(truncation, "MAX_BYTES_REACHED");
        return;
      }
      files.push({ absolutePath, relativePath, size });
      bytesParsed += size;
    }
  };

  visit(root.absolute);
  files.sort((left, right) => left.relativePath < right.relativePath ? -1 : left.relativePath > right.relativePath ? 1 : 0);
  return {
    files,
    diagnostics,
    truncation,
    filesScanned: files.length,
    bytesParsed
  };
}
