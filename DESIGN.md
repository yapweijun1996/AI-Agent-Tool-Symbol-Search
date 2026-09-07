# agent-symbol-search Design

| Field | Value |
|---|---|
| Status | Active |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |
| Implementation baseline | V1 TypeScript vertical slice is implemented in the current working tree; no package has been published |

## 1. Purpose and boundary

`agent-symbol-search` is a deterministic, local-first, read-only symbol-navigation engine for coding agents. It answers where a symbol is defined, referenced, or explicitly implemented without returning an entire repository or executing project code.

The implementation locates code; it does not return source bodies. `agent-code-slice` remains responsible for exact source extraction.

## 2. Verified current state

The working tree now contains a Node.js/TypeScript package, JSON schemas, a CLI, a library API, TypeScript fixtures, contract tests, security tests, and a benchmark baseline. The package is version `0.1.0` and is unreleased. The original documentation changes in the working tree are preserved; they are not treated as released history.

The executable TypeScript capability is verified by the test suite and packaged-artifact smoke test. JavaScript, Python, and CFML remain proposed adapters. No precision, latency, or memory threshold is claimed beyond the measurements in `BENCHMARK.md`.

## 3. V1 delivery boundary

V1.0 provides:

- TypeScript source discovery and normalized symbol extraction;
- exact, prefix, and substring declaration search;
- compiler/checker-backed definitions, references, and import aliases;
- explicit `implements`, `extends`, and supported abstract-method implementation relationships;
- one shared core behind the library API and CLI;
- versioned JSON results with stable locators, IDs, ranking, limits, ambiguity, and diagnostics;
- bounded, read-only discovery with root, symlink, ignore, secret, and resource boundaries.

The implementation deliberately does not claim complete structural typing or dynamic dispatch resolution.

## 4. Architecture

```text
CLI / Library API
        |
Request schema validation
        |
Canonical repository root + bounded discovery
        |
Deterministic TypeScript project selection
        |
TypeScript Program / checker
        |
Declaration index + semantic traversal
        |
Normalizer + symbol identity
        |
Stable ranker + result limits
        |
Versioned JSON result
```

The implemented layout is:

```text
src/
  cli.ts
  index.ts
  types.ts
  core/
    discovery.ts
    engine.ts
    paths.ts
    project.ts
    ranking.ts
    symbols.ts
    validation.ts
schemas/
test/
scripts/
```

`typescript` is used as a runtime dependency because search creates a compiler `Program`; `ajv`, `ignore`, and `minimatch` provide runtime schema and discovery behavior. Versions are pinned in `package.json` and `package-lock.json`. Node.js `>=20.0.0` is the supported engine range.

## 5. Ownership boundaries

| Concern | Owner | Boundary |
|---|---|---|
| Repository structure, package manager, commands | `agent-project-profile` | Symbol search consumes project context; it does not re-profile the repository |
| Symbol locations and relationships | `agent-symbol-search` | This package returns evidence and locators only |
| Exact source extraction | `agent-code-slice` | Symbol search does not return source bodies |
| Blast radius and change risk | `agent-change-impact` | References are evidence, not impact conclusions |
| Test selection | `agent-test-scope` | Symbol search does not select tests |
| Error interpretation | `agent-error-lens` | Symbol search may locate an error-related symbol |

## 6. TypeScript project model

Project selection is deterministic:

1. An explicit `project` must resolve to an in-root existing `tsconfig*.json` file.
2. Without `project`, the tool discovers `tsconfig*.json` files using the same bounded ignore and secret policy.
3. Exactly one discovered config is selected.
4. Multiple configs return an `INVALID_REQUEST` error with every candidate and an instruction to pass `project`; the first config is never selected.
5. With no config, fixed fallback options are used: CommonJS/Node resolution, ES2022 target, strict checking, no emit, no JavaScript, and preserved JSX.

A selected config's `include`/`files` set controls the Program, filtered to discovered in-root TypeScript files. `paths`, `baseUrl`, and module resolution are honored by the TypeScript compiler. Project references are reported as `SEMANTIC_RESOLUTION_UNAVAILABLE` and are not recursively built in V1. JavaScript enabled by a config is deliberately excluded because JavaScript is not a shipped adapter. Compiler version and selected project/fallback mode are present in `stats`.

Compiler-resolved external package files may participate in type resolution, but only discovered in-root files can become result matches. This prevents `node_modules` and other external files from appearing as repository results.

## 7. Discovery, security, and limits

The root and every explicit path are canonicalized with `realpath`, then checked with a path-relative containment test. Explicit symlinks targeting outside the root fail. Directory and file symlinks are not followed during default traversal. Secret-like basenames (`.env`, `.env.*`, `*.pem`, `*.key`, `credentials.*`, and `secrets.*`) are always excluded, including when a pattern tries to include them.

Traversal is sorted by path using locale-independent comparisons. `.gitignore` is honored. `--exclude` wins over all ordinary matching; `--include` acts as an allow-list and can override `.gitignore` and ordinary generated-directory filters. `.git`, `node_modules`, symlink, secret, and root boundaries cannot be overridden. Default generated/vendor directories include `.git`, `node_modules`, `dist`, `build`, `coverage`, `.cache`, `vendor`, and `generated`.

The resource defaults are:

```text
maximum files: 10,000
maximum single file: 2 MiB
maximum parsed bytes: 100 MiB
default results: 50
maximum results: 500
cooperative timeout budget: 5 seconds
```

File, byte, result, and timeout limits set `truncation.truncated`, add a specific reason, and normally return `partial`. A syntax or project-configuration diagnostic also yields `partial` when usable evidence remains. No persistent repository cache is written. The timeout is cooperative: discovery, indexing, and reference traversal check a deadline; it is not presented as a hard process isolation guarantee.

## 8. Read-only and execution boundary

Source is read as data. The library never imports project modules, calls `eval` or `Function`, invokes child processes, installs dependencies, builds, tests, modifies the repository, accesses a network, or calls an LLM. Packaging and verification scripts may invoke local commands, but those are not search behavior and are outside the library entrypoint.

## 9. Contract decisions

The public result uses:

- `schemaVersion: "1"` and status values `complete`, `partial`, and `error`;
- normalized symbol kinds, relations, and categorical confidence;
- 1-based lines, 0-based UTF-16 columns, and exclusive end positions;
- POSIX-style repository-relative paths;
- SHA-256 symbol IDs that omit line numbers;
- deterministic confidence/relation/name/context/path/position/ID ordering;
- structured diagnostics and truncation reasons rather than silent omission.

TypeScript compiler/checker evidence is `confirmed`. Search declarations and semantic references use the same resolver label, `typescript-semantic`; heuristic evidence is not emitted as confirmed. Implementation results cover only explicit `implements`/`extends` on class declarations or variable-bound class expressions and supported abstract overrides.

Symbol identity normalization removes comments and collapses whitespace from a declaration signature. Overload signatures retain their parameter/type differences; declaration-merged interfaces share the same normalized name/kind/header identity; anonymous default declarations use the stable name `default`; paths are normalized before hashing.

## 10. Rejected and deferred alternatives

- Regex-only semantic search is rejected for TypeScript definitions, references, and aliases.
- Fuzzy search, user-supplied regex, and ReDoS-sensitive ranking are outside V1.
- Persistent databases and caches are deferred until benchmark evidence justifies them.
- Runtime imports, execution, and LLM calls are rejected by the read-only boundary.
- Python, CFML, and JavaScript adapters are later phases, not current capabilities.
- Structural typing, dynamic dispatch, mixins, and runtime patching are not confirmed implementations.
- MCP wrapping, code slicing, change impact, and test selection remain separate tools.

## 11. Completion evidence

The V1 implementation is considered verified only with all of the following:

1. `npm run verify` passes type checking, static safety checks, build, contract tests, golden TypeScript fixtures, ambiguity, range/ID/order, project-selection, bounds, CLI/library parity, and read-only/security cases.
2. `npm run smoke:pack` passes from a temporary directory outside the source checkout.
3. `npm run capability:check` reports TypeScript V1 support and future adapters as proposed.
4. `npm run benchmark:check` validates the cold/warm small, medium, and large baseline in `BENCHMARK.md`.
5. `npm run docs:check` confirms documentation metadata, links, schemas, examples, and current/proposed claims.
