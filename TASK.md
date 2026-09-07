# agent-symbol-search Task Plan

| Field | Value |
|---|---|
| Status | Active |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |
| Source of truth | Current repository plus executable evidence once implementation begins |

## Current repository truth

- Only `.gitattributes` is committed as project content.
- No package manifest, source, test, fixture, schema, benchmark, or CLI exists.
- No task below may be described as implemented until executable evidence is added.
- The current documentation change establishes the proposed baseline; it does not ship runtime behavior.

## Completed in this documentation baseline

### DOC-001 — Record implementation baseline

**Status:** Complete for this documentation change.

**Deliverable:** Design, contract, epic, roadmap, task, README, and changelog describe the repository as unimplemented and distinguish proposed behavior from shipped behavior.

**Acceptance checks:**

- `git ls-tree -r --name-only HEAD` confirms the initial commit has no runtime implementation.
- Each top-level project document has status, owner, and review metadata.

## Active implementation tasks

### CORE-001 — Bootstrap package and toolchain

**Status:** Blocked

**Deliverable:** Add the package manifest, selected Node.js range, TypeScript compiler, test runner, build configuration, and library/CLI entrypoints.

**Acceptance checks:**

- Clean checkout install and typecheck command succeed.
- Installed-artifact smoke command is defined and succeeds.

**Affected contract:** `SPEC.md` Sections 1, 2, 15; add a changelog entry when behavior ships.

### CONTRACT-001 — Implement versioned schemas

**Status:** Blocked by CORE-001

**Deliverable:** Add request/result/capability schemas and runtime validation for operations, ranges, errors, diagnostics, truncation, and match fields.

**Acceptance checks:**

- Valid illustrative examples in `SPEC.md` validate against maintained schemas.
- Invalid root, range, limit, operation, and enum values produce structured errors.

**Affected contract:** `SPEC.md` Sections 3–6, 11, 14.

### DISCOVERY-001 — Implement bounded read-only discovery

**Status:** Blocked by CORE-001

**Deliverable:** Implement canonical root validation, path containment, deterministic traversal, ignore rules, secret exclusions, file-size/file-count/byte limits, and parse diagnostics.

**Acceptance checks:**

- A symlink or path outside root is rejected.
- Fixture operations do not modify tracked, untracked, or ignored repository files.
- Limit hits return `partial` with explicit truncation reasons.

**Affected contract:** `SPEC.md` Sections 12–13.

### TS-001 — Implement TypeScript project selection and symbols

**Status:** Blocked by CORE-001 and CONTRACT-001

**Deliverable:** Build a deterministic TypeScript Program and normalize declarations into the public symbol taxonomy.

**Acceptance checks:**

- Symbols are extracted from the TypeScript fixture set with stable paths, kinds, ranges, and IDs.
- Multiple `tsconfig` behavior is covered by tests and reflected in diagnostics.

**Affected contract:** `SPEC.md` Sections 3, 4, 7, 8.

### TS-002 — Implement definitions and references

**Status:** Blocked by TS-001

**Deliverable:** Resolve definitions, import aliases, and supported references using compiler/checker evidence; report unsupported cases honestly.

**Acceptance checks:**

- Alias and class-method fixtures resolve to the intended declaration.
- Comments and string literals never become semantic references.
- Ambiguous no-context queries return bounded matches without selecting arbitrarily.

**Affected contract:** `SPEC.md` Sections 5, 6, 10.

### TS-003 — Implement explicit implementations

**Status:** Blocked by TS-001

**Deliverable:** Resolve explicit `implements`, `extends`, and supported abstract-method implementation relationships without claiming complete structural typing.

**Acceptance checks:**

- Interface/class and base/derived fixtures produce the documented relations.
- Structural or dynamic cases outside the supported subset return partial, candidate, or unsupported evidence.

**Affected contract:** `SPEC.md` Sections 2, 5, 11.

### API-001 — Implement shared library and CLI

**Status:** Blocked by TS-002

**Deliverable:** Expose `getCapabilities`, `searchSymbols`, `findDefinition`, `findReferences`, `findImplementations`, and `listSymbols` over the same core.

**Acceptance checks:**

- CLI JSON and library results are equivalent for the same request.
- Output is stable across repeated runs and writes no source or cache files.

**Affected contract:** `SPEC.md` Sections 2, 3, 6, 9.

### VERIFY-001 — Add golden, security, and package tests

**Status:** Blocked by implementation tasks

**Deliverable:** Add the TypeScript fixture matrix, malformed/ignored/symlink/limit fixtures, stable ordering checks, and installed-package smoke tests.

**Acceptance checks:**

- TS-01 through TS-05 and the documented false-positive, truncation, path, and read-only cases pass.
- `npm pack` or the selected package equivalent runs outside the source checkout.

**Affected contract:** All implemented `SPEC.md` sections; add changelog entry for the release behavior.

### BENCH-001 — Establish performance baseline

**Status:** Planned

**Deliverable:** Measure files, bytes, parse/resolution/total time, memory, matches, and truncation on small, medium, and large fixtures.

**Acceptance checks:**

- Results distinguish cold and warm in-memory runs.
- No latency acceptance threshold is claimed before the baseline is reviewed.

## Blockers and next step

The immediate blocker is the absence of a package/toolchain and implementation. The next safe step is `CORE-001`, followed by `CONTRACT-001`; parser work must not begin before the public contract and TypeScript project model are executable and tested.
