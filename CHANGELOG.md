# Changelog

| Field | Value |
|---|---|
| Status | Active |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |

All entries are user-visible changes. Package `0.1.0` is currently unreleased; no deployment or remote push is implied.

## Unreleased — 0.1.0

### Runtime

- Added a shared TypeScript compiler/checker-backed library and `agent-symbol-search` CLI.
- Added `capabilities`, exact/prefix/substring `search`, `symbols`, `definition`, `references`, and explicit `implements`/`extends`/abstract-method `implementations` operations.
- Added versioned JSON schemas and runtime validation for requests, results, capabilities, ranges, IDs, diagnostics, truncation, and limits.
- Added deterministic TypeScript project selection, fixed no-config fallback behavior, path-alias support, ambiguity diagnostics, normalized kinds including stable constructors, effective export-specifier/re-export state, exported variable/binding state, variable-bound class-expression relationships, POSIX paths, UTF-16 ranges, and SHA-256 symbol identities.
- Added bounded read-only discovery with root/symlink containment, `.gitignore`, nested include-glob reachability, non-overridable `node_modules` exclusion, include/exclude precedence, secret exclusions, file/byte/result budgets, and cooperative timeout diagnostics.

### Verification

- Added TypeScript golden fixtures, shorthand-reference and constructor coverage, effective-export and outside-root diagnostic regressions, false-positive, project-selection, security, limit, read-only, CLI/library parity, and installed-artifact smoke tests.
- Added `BENCHMARK.md` with reproducible cold/warm small, medium, and large fixture measurements without a latency guarantee.
- Added documentation, schema, capability, packaging, benchmark-evidence, and verification scripts; docs and benchmark checks compare claims with runtime output and fresh deterministic fixture measurements.

### Documentation

- Reconciled README, DESIGN, SPEC, EPIC, ROADMAP, TASK, and documentation-governance status with the verified working-tree implementation.
- Recorded that JavaScript, Python, CFML, structural typing, dynamic dispatch, persistent cache, MCP, code slicing, impact analysis, test selection, release, deployment, and push remain outside this V1 scope.
