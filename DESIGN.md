# agent-symbol-search Design

| Field | Value |
|---|---|
| Status | Proposed |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |
| Implementation baseline | Repository contains no runtime, package manifest, tests, schemas, or fixtures yet |

## 1. Purpose

`agent-symbol-search` is intended to be a deterministic, local-first, read-only symbol-navigation engine for coding agents. It answers where a symbol is defined, referenced, or implemented without returning an entire repository or executing project code.

This document describes the target architecture. It does **not** claim that the architecture is implemented. The normative target behavior is in [`SPEC.md`](./SPEC.md).

## 2. Current state

The current repository is an initial documentation-only baseline. The only committed project file is `.gitattributes`; no CLI, library API, capability registry, parser adapter, schema, test, fixture, or benchmark exists yet.

Therefore:

- no operation is currently shipped;
- no language is currently supported by executable code;
- no performance or precision claim has been measured;
- all implementation and support statements below are proposed decisions.

## 3. V1 delivery boundary

The first implementation milestone is deliberately narrow:

### V1.0 target

- TypeScript source discovery and symbol extraction;
- TypeScript definitions;
- TypeScript references using compiler/checker evidence;
- explicit `implements`, `extends`, and abstract-method implementation relationships;
- CLI and library API sharing one core;
- bounded JSON results;
- read-only and path-boundary guarantees.

### Later adapters

- JavaScript reuses the TypeScript infrastructure after the TypeScript vertical slice is verified;
- Python begins with structured AST symbols and bounded import heuristics;
- CFML begins with an explicit parser/lexical subset and candidate confidence only where semantic resolution is unavailable.

Python and CFML are not V1.0 shipped capabilities.

## 4. Architecture

```text
CLI / Library API
        |
Request validation
        |
Repository boundary + discovery
        |
Language/project selection
        |
Language adapter
        |
Resolver / index
        |
Normalizer + confidence assignment
        |
Stable ranker + result limits
        |
Versioned JSON result
```

The intended source layout is:

```text
src/
  cli/
  core/
  discovery/
  adapters/typescript/
  adapters/javascript/
  adapters/python/
  adapters/cfml/
  ranking/
  schema/
  library/
```

Directories are proposed only; they do not exist in the current checkout.

## 5. Ownership boundaries

| Concern | Owner | Boundary |
|---|---|---|
| Repository structure, package manager, commands | `agent-project-profile` | Symbol search consumes project context; it does not re-profile the repository |
| Symbol locations and relationships | `agent-symbol-search` | This project returns evidence and locators only |
| Exact source extraction | `agent-code-slice` | Symbol search does not return source bodies |
| Blast radius and change risk | `agent-change-impact` | References are evidence, not impact conclusions |
| Test selection | `agent-test-scope` | Symbol search does not select tests |
| Error interpretation | `agent-error-lens` | Symbol search may locate an error-related symbol |

## 6. TypeScript project model

The implementation MUST make project selection deterministic. It must support an explicit project/`tsconfig.json` input before relying on auto-discovery. Auto-discovery, when implemented, must document how multiple configs, project references, path aliases, JavaScript mode, and files outside the selected project are handled.

The compiler version and effective project configuration are part of the resolver context. Results must not silently mix compiler configurations. External package files are excluded from repository results by default and may only be included through an explicit future option.

The TypeScript compiler API provides syntax, symbols, aliases, and type-checker evidence, but reference discovery still requires controlled AST traversal and checker-based resolution. It is not treated as a turnkey find-references engine.

## 7. Contract decisions

The target contract uses:

- a versioned result envelope with `complete`, `partial`, and `error` states;
- normalized symbol kinds across languages;
- categorical confidence: `confirmed`, `strong`, `candidate`, `unknown`;
- explicit relation values such as `definition`, `declaration`, `reference`, `implementation`, and `inheritance`;
- 1-based lines, 0-based UTF-16 columns, and exclusive end positions;
- stable POSIX-style repository-relative paths;
- a versioned SHA-256 symbol identity that does not use line numbers;
- deterministic ordering with a final stable tie-breaker;
- diagnostics and truncation reasons instead of silent omission.

The full proposed contract is in [`SPEC.md`](./SPEC.md).

## 8. Read-only and security boundary

Project source is data, never executable code. The implementation MUST NOT import project modules, call `eval`, install dependencies, build, test, modify the repository, access the network, or invoke an LLM during a search.

The repository root and every explicit path must be canonicalized and verified to remain inside the root. Directory symlinks are not followed by default. Secret-like files and generated directories are excluded by default. Malformed or oversized files produce diagnostics or partial results rather than bypassing limits.

## 9. Resource and determinism model

Initial limits are engineering budgets, not benchmarked guarantees:

- maximum files: 10,000;
- maximum single file: 2 MiB;
- maximum parsed bytes: 100 MiB;
- default results: 50;
- maximum results: 500;
- target request budget: 5 seconds.

The timeout must be implemented as cooperative cancellation or process/worker isolation; a configuration value alone is not a hard timeout. The implementation must measure cold and warm in-memory operation separately. No persistent repository cache is planned for V1.0.

Stable behavior requires pinned dependency versions, deterministic discovery, locale-independent sorting, explicit path normalization, and a documented TypeScript project-selection algorithm.

## 10. Rejected or deferred alternatives

- **Regex-only semantic search:** rejected for TypeScript definitions, references, and aliases; it remains unsuitable for confirmed semantic evidence.
- **Fuzzy or regex user search:** deferred because ranking, noise, and ReDoS behavior are not yet justified.
- **Persistent repository database:** deferred until cold-scan benchmarks demonstrate a need.
- **Runtime imports or execution:** rejected because they violate the read-only safety boundary.
- **Mega-tool with code slicing and impact analysis:** rejected to preserve small context and ownership boundaries.
- **Full Python/Python-type-checker and CFML runtime resolution in V1.0:** deferred until the TypeScript contract is verified.
- **MCP runtime inside the core package:** deferred; a future adapter may wrap the same library API.

## 11. Dependencies and risks

Planned dependencies include Node.js, TypeScript Compiler API, a TypeScript test runner, and a JSON-schema validation approach. The exact package versions and runtime engine range are not selected in the current repository.

Key risks are project/configuration selection, reference precision, TypeScript structural typing, platform path behavior, cancellation under large repositories, and semantic drift between documentation and generated capability output.

## 12. Completion evidence

This design is not complete as an implementation until the repository has:

1. executable schemas and contract tests;
2. a TypeScript vertical slice covering the V1.0 operations;
3. security, bounds, ambiguity, and determinism tests;
4. package/installed-artifact smoke tests;
5. benchmark output for small, medium, and large fixtures.
