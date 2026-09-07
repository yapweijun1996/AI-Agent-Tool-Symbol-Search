# agent-symbol-search Task Plan

| Field | Value |
|---|---|
| Status | Active |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |
| Source of truth | Current repository plus executable evidence |
| Working-tree scope | V1 TypeScript implementation, verification artifacts, and synchronized documentation; package 0.1.0 is unreleased |

## Current repository truth

- `HEAD` is the current V1 implementation line; the historical documentation-only baseline is an ancestor in Git history, not the current repository state. The exact checked-out commit is recorded by `git log --oneline --decorate -5` in the verification evidence.
- The package has no published release and no remote branch has been pushed by this work.
- JavaScript, Python, and CFML are proposed future adapters, not current capabilities.
- No task is considered complete from documentation alone; each completed task below has executable evidence.

## Completed documentation baseline

### DOC-001 — Record implementation baseline

**Status:** Complete.

The design, contract, epic, roadmap, task plan, README, documentation standard, and changelog distinguish proposed behavior from shipped/verified behavior and preserve the original documentation changes.

**Evidence:** `git log --oneline --decorate -5` and `git status --short --branch` identify the implementation-bearing checkout; `npm run docs:check` checks current metadata, links, contract markers, runtime claims, and schemas.

## Completed V1 implementation tasks

### CORE-001 — Bootstrap package and toolchain

**Status:** Complete.

**Deliverable:** `package.json`, `package-lock.json`, Node.js `>=20.0.0` policy, pinned TypeScript/Ajv/discovery dependencies, compiler configuration, test runner, build output, and CLI/library entrypoints.

**Acceptance evidence:** `npm ci --ignore-scripts --no-audit --no-fund`, `npm run typecheck`, `npm run build`, and `npm run smoke:pack` pass.

**Affected contract:** `SPEC.md` Sections 1–3, 15–16; runtime behavior is recorded in `CHANGELOG.md`.

### CONTRACT-001 — Implement versioned schemas

**Status:** Complete.

**Deliverable:** Maintained request/result/capability JSON schemas and Ajv runtime validation for operations, ranges, IDs, enums, diagnostics, truncation, limits, project selection, and result envelopes.

**Acceptance evidence:** `npm run verify` validates all six operations, valid results/capabilities, invalid operation/root/range/limit/enum inputs, and CLI JSON/error behavior.

**Affected contract:** `SPEC.md` Sections 3–6, 11, 14.

### DISCOVERY-001 — Implement bounded read-only discovery

**Status:** Complete.

**Deliverable:** Canonical root validation, explicit symlink containment, deterministic traversal, `.gitignore`, include/exclude precedence, secret exclusions, file/byte/result limits, timeout checks, and parse diagnostics.

**Acceptance evidence:** Security tests cover outside-root paths, external symlinks, directory symlinks, ignored and secret files, outside-root project-file sanitization/partial status, no-write/no-execution behavior, and explicit truncation reasons.

**Affected contract:** `SPEC.md` Sections 12–13.

### TS-001 — Implement TypeScript project selection and symbols

**Status:** Complete.

**Deliverable:** Deterministic one-config/multiple-config/no-config project selection, fixed fallback options, selected-config filtering, path aliases, external-file exclusion, project-reference reporting, normalized declaration kinds, ranges, qualified names, exported state, and versioned IDs.

**Acceptance evidence:** TypeScript tests cover aliases, project references, overloads, default/anonymous exports, declaration merging, namespaces, exported variable/binding declarations, class-expression owners, stable POSIX paths, and UTF-16 range positions.

**Affected contract:** `SPEC.md` Sections 3, 4, 7, 8.

### TS-002 — Implement definitions and references

**Status:** Complete.

**Deliverable:** Compiler/checker-backed definitions, import aliases, source-position resolution, overload/ambiguity reporting, and semantic reference traversal that excludes comments and string literals.

**Acceptance evidence:** Golden tests cover alias and method references, context-free ambiguity, source positions, no-match diagnostics, and false positives.

**Affected contract:** `SPEC.md` Sections 5, 6, 10.

### TS-003 — Implement explicit implementations

**Status:** Complete.

**Deliverable:** Explicit `implements` and `extends` relationships for class declarations and variable-bound class expressions, plus supported abstract-method overrides, with no structural, dynamic, mixin, or runtime-patching claims.

**Acceptance evidence:** Fixtures distinguish implementation from inheritance for declarations and class expressions, cover exported-state regressions, and return partial semantic-unavailable evidence for unsupported structural cases.

**Affected contract:** `SPEC.md` Sections 2, 5, 11.

### API-001 — Implement shared library and CLI

**Status:** Complete.

**Deliverable:** `getCapabilities`, `searchSymbols`, `findDefinition`, `findReferences`, `findImplementations`, `listSymbols`, and `execute` over one core; separate CLI position flags; JSON stdout, stderr diagnostics, and exit codes.

**Acceptance evidence:** CLI/library parity, deterministic repeated output, stdout/stderr separation, complete/partial/error exits, and packaged API tests pass.

**Affected contract:** `SPEC.md` Sections 2, 3, 6, 9, 15.

### VERIFY-001 — Add golden, security, and package tests

**Status:** Complete.

**Deliverable:** TypeScript fixture matrix, malformed/config/ignored/symlink/limit fixtures, stable ordering checks, read-only checks, capability checks, and installed-package smoke coverage.

**Acceptance evidence:** `npm run verify`, `npm run capability:check`, and `npm run smoke:pack` pass; the latter runs outside the source checkout.

**Affected contract:** All implemented `SPEC.md` sections.

### BENCH-001 — Establish performance baseline

**Status:** Complete for baseline measurement.

**Deliverable:** Reproducible generated small, medium, and large fixtures with separate cold and warm in-memory measurements for files, bytes, time, memory, matches, and truncation.

**Acceptance evidence:** `BENCHMARK.md` is checked by `npm run benchmark:check`. It records evidence without claiming an unmeasured latency threshold.

## Verification status

The full V1 verification commands are:

```bash
npm ci
npm run verify
npm run smoke:pack
npm run capability:check
npm run benchmark:check
npm run docs:check
git diff --check
```

`npm run verify` runs static safety checks, typecheck, build, and the Node test suite. Packaging, capability, benchmark, and documentation checks are separate reproducible gates. No network, deployment, release, or push is performed by these project commands except dependency installation needed for setup and the package smoke test.

## Blockers and next step

No actionable V1 TypeScript task remains blocked. Future language adapters, ecosystem integration, performance optimization, and release readiness remain explicitly proposed or in progress in `ROADMAP.md` and require separate scope approval.
