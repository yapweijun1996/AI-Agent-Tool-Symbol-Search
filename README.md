# agent-symbol-search

| Field | Value |
|---|---|
| Status | Active |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |
| Package version | 0.1.0 (unreleased) |

> Deterministic, local-first, read-only symbol navigation for AI coding agents.

## What it does

`agent-symbol-search` answers focused navigation questions without returning full source bodies:

- Where is `buildProject` defined?
- Who references `ProjectProfile`?
- Which class explicitly implements `StorageAdapter`?
- What symbols exist in this file?

The result is a bounded locator. [`agent-code-slice`](https://github.com/yapweijun1996/AI-Agent-Tool-Code-Slice) remains responsible for reading the returned source range.

## Current support

The V1.0 implementation supports TypeScript through the TypeScript compiler API:

| Operation | Support | Evidence boundary |
|---|---|---|
| `capabilities` | Full | Reports the operation-level matrix |
| `search` | Full | Exact, prefix, and substring declaration-name matching |
| `symbols` | Full | Normalized declarations in one TypeScript file |
| `definition` | Full | Compiler/checker definitions, aliases, overloads, and ambiguity |
| `references` | Full | Compiler/checker references and import aliases |
| `implementations` | Partial | Explicit `implements`, `extends`, and supported abstract-method overrides |

JavaScript, Python, and CFML are proposed future adapters, not shipped capabilities. Structural assignability, dynamic dispatch, mixins, and runtime monkey-patching are not confirmed implementation evidence.

## Quick start

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
npm run build
node dist/cli.js capabilities --root .
node dist/cli.js definition --root ./path/to/repository --symbol resolveConfig
```

The CLI writes one JSON result to stdout. Human-readable diagnostics go to stderr, so stdout can be piped to a JSON parser safely. A complete or partial result exits `0`; invalid requests, invalid roots, and path/security failures exit non-zero.

The library uses the same request/result contract:

```js
const { findDefinition } = require("agent-symbol-search");

const result = findDefinition({
  root: "./path/to/repository",
  symbol: "resolveConfig"
});
console.log(result.data.matches);
```

## Determinism, bounds, and safety

- Every request has an explicit canonicalized root; explicit paths and symlinks cannot escape it.
- Directory symlinks, generated/vendor directories, ignored files, and secret-like files are excluded by default.
- `--exclude` always wins; `--include` is an allow-list that can override `.gitignore` and ordinary generated-directory filters, but never secret, `.git`, symlink, or root boundaries.
- Results use stable POSIX-relative paths, 1-based lines, 0-based UTF-16 columns, versioned SHA-256 symbol IDs, deterministic ranking, and explicit ambiguity/truncation diagnostics.
- Default and maximum result limits are 50 and 500. Discovery limits are 10,000 files, 2 MiB per file, and 100 MiB parsed bytes. The 5-second budget is cooperative and returns partial evidence with `TIMEOUT` when reached.
- Search reads project files as data. It does not import or execute project code, install dependencies, build, test, modify repositories, access the network, or call an LLM. `npm ci` is setup-time installation, not search behavior.

TypeScript project selection is deterministic: an explicit `project` must be a repository-relative `tsconfig*.json`; without one, exactly one discovered config is selected, multiple configs produce an actionable error, and no config uses fixed fallback compiler options. Project references are reported but not recursively built in V1. External package files are excluded from repository results.

## Verification and packaging

Run the complete local verification contract:

```bash
npm run verify
npm run smoke:pack
npm run capability:check
npm run benchmark:check
npm run docs:check
```

`smoke:pack` installs the npm tarball in a temporary directory outside the source checkout and exercises both the CLI and library API. `BENCHMARK.md` records cold and warm in-memory measurements for deterministic small, medium, and large generated fixtures; it is a baseline, not a performance guarantee.

## Documentation

- [`DESIGN.md`](./DESIGN.md) — implemented architecture, boundaries, and trade-offs
- [`SPEC.md`](./SPEC.md) — normative request/result contract
- [`EPIC.md`](./EPIC.md) — TypeScript vertical-slice outcome
- [`ROADMAP.md`](./ROADMAP.md) — completed and future work
- [`TASK.md`](./TASK.md) — evidence-backed task status
- [`CHANGELOG.md`](./CHANGELOG.md) — unreleased and historical changes
- [`BENCHMARK.md`](./BENCHMARK.md) — reproducible performance baseline
- [`DOCUMENTATION_STANDARD.md`](./DOCUMENTATION_STANDARD.md) — documentation governance
