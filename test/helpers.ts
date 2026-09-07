import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

export const fixtureRoot = resolve(process.cwd(), "test/fixtures/typescript");

export function temporaryDirectory(prefix = "agent-symbol-search-test-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function copyTypeScriptFixture(prefix = "agent-symbol-search-fixture-"): string {
  const directory = temporaryDirectory(prefix);
  cpSync(fixtureRoot, directory, { recursive: true });
  return directory;
}

export function removeDirectory(directory: string): void {
  rmSync(directory, { recursive: true, force: true });
}

export function writeSource(root: string, relativePath: string, content: string): void {
  const path = join(root, relativePath);
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, content, "utf8");
}

export function snapshotFiles(root: string): string {
  const entries: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)) {
      const path = join(directory, entry.name);
      const relative = path.slice(root.length + 1).replaceAll("\\", "/");
      if (entry.isDirectory()) {
        visit(path);
      } else if (entry.isFile()) {
        entries.push(`${relative}:${createHash("sha256").update(readFileSync(path)).digest("hex")}`);
      } else if (entry.isSymbolicLink()) {
        entries.push(`${relative}:symlink`);
      }
    }
  };
  visit(root);
  return entries.join("\n");
}

export function tryCreateSymlink(target: string, linkPath: string, type: "file" | "dir" = "file"): boolean {
  try {
    symlinkSync(target, linkPath, type);
    return true;
  } catch {
    return false;
  }
}

export function readJsonOutput(output: string): unknown {
  return JSON.parse(output);
}

export function pathExists(path: string): boolean {
  return existsSync(path);
}
