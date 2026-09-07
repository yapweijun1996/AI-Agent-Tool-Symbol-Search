import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { SymbolSearchEngine } = require(resolve("dist/index.js"));
const reportPath = resolve("BENCHMARK.md");
const suites = [
  { name: "small", files: 5, symbolsPerFile: 10 },
  { name: "medium", files: 40, symbolsPerFile: 25 },
  { name: "large", files: 160, symbolsPerFile: 50 }
];

function createFixture(parent, suite) {
  const root = join(parent, suite.name);
  mkdirSync(root, { recursive: true });
  for (let fileIndex = 0; fileIndex < suite.files; fileIndex += 1) {
    const lines = [];
    for (let symbolIndex = 0; symbolIndex < suite.symbolsPerFile; symbolIndex += 1) {
      const id = fileIndex * suite.symbolsPerFile + symbolIndex;
      lines.push(`export function benchmarkSymbol${id}(value: string): string { return value + '${id}'; }`);
    }
    writeFileSync(join(root, `file-${String(fileIndex).padStart(4, "0")}.ts`), `${lines.join("\n")}\n`, "utf8");
  }
  return root;
}

function measure(root, engine) {
  const before = process.memoryUsage().rss;
  const start = performance.now();
  const result = engine.execute({ operation: "search", root, symbol: "benchmarkSymbol", match: "prefix", limit: 500 });
  const elapsed = performance.now() - start;
  const after = process.memoryUsage().rss;
  return {
    files: result.stats.filesScanned ?? 0,
    bytes: result.stats.bytesParsed ?? 0,
    timeMs: Number(elapsed.toFixed(3)),
    memoryBytes: Math.max(0, after - before),
    matches: result.data.matches.length,
    truncation: result.truncation.truncated ? result.truncation.reasons.join(",") : "none",
    status: result.status
  };
}

function formatMeasurement(measurement) {
  return `files=${measurement.files}; bytes=${measurement.bytes}; time_ms=${measurement.timeMs}; memory_bytes=${measurement.memoryBytes}; matches=${measurement.matches}; truncation=${measurement.truncation}; status=${measurement.status}`;
}

const temporary = mkdtempSync(join(tmpdir(), "agent-symbol-search-benchmark-"));
try {
  const results = [];
  for (const suite of suites) {
    const root = createFixture(temporary, suite);
    const engine = new SymbolSearchEngine();
    const cold = measure(root, engine);
    const warm = measure(root, engine);
    results.push({ suite, cold, warm });
  }
  const lines = [
    "# Benchmark baseline",
    "",
    "| Field | Value |",
    "|---|---|",
    "| Status | Active |",
    "| Owner | Project maintainers |",
    "| Last reviewed | 2026-09-07 |",
    "",
    "This report records reproducible local measurements from generated TypeScript fixtures. It is evidence, not a latency or memory guarantee. Each warm run is a second in-memory operation in the same process; V1 has no persistent disk cache.",
    "",
    `- Node.js: ${process.version}`,
    "- Resolver: TypeScript compiler API",
    "- Fixture generation: deterministic file and symbol counts in `scripts/benchmark.mjs`",
    ""
  ];
  for (const { suite, cold, warm } of results) {
    lines.push(`## ${suite.name}`, "", `- Fixture: ${suite.files} files × ${suite.symbolsPerFile} symbols`, `- Cold: ${formatMeasurement(cold)}`, `- Warm: ${formatMeasurement(warm)}`, "");
  }
  const report = `${lines.join("\n").trimEnd()}\n`;
  if (process.argv.includes("--check")) {
    if (!existsSync(reportPath)) throw new Error("BENCHMARK.md is missing; run `node scripts/benchmark.mjs` to create it");
    const existing = readFileSync(reportPath, "utf8");
    for (const suite of suites) {
      if (!existing.includes(`## ${suite.name}`)) {
        throw new Error(`BENCHMARK.md is missing ${suite.name}`);
      }
    }
    const measurements = [...existing.matchAll(/^- (?:Cold|Warm): (.+)$/gm)].map((match) => match[1]);
    if (measurements.length !== suites.length * 2 || measurements.some((line) => !/files=\d+; bytes=\d+; time_ms=\d+(?:\.\d+)?; memory_bytes=\d+; matches=\d+; truncation=[^;]+; status=(?:complete|partial)/.test(line))) {
      throw new Error("BENCHMARK.md does not contain complete cold/warm files, bytes, time, memory, matches, truncation, and status metrics");
    }
    console.log(report);
  } else {
    writeFileSync(reportPath, report, "utf8");
    console.log(report);
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
