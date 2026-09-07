# agent-symbol-search Roadmap

| Field | Value |
|---|---|
| Status | Proposed |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |
| Planning horizon | Sequenced by evidence, not dates |

This roadmap describes future intent. It never implies that an unimplemented operation or language is currently supported.

## Baseline

**Status: In progress — documentation only.**

The repository currently has no runtime, package manifest, tests, fixtures, schemas, or benchmarks. No capability is shipped and no release date is committed.

## Phase 0 — Contract foundation

**Status: Planned**

### Outcome
Freeze the smallest machine-readable contract before writing multiple parsers.

### Work

- create package and runtime policy;
- implement request/result types and JSON schemas;
- define status, diagnostics, failure codes, limits, ranges, identity, confidence, and ordering;
- define deterministic TypeScript project selection;
- add contract validation tests.

### Dependencies
None, except selecting the runtime and test toolchain.

### Evidence
Schema validation and contract tests run from a clean checkout. No operation is called complete until the tests exist.

## Phase 1 — TypeScript vertical slice

**Status: Planned**

### Outcome
Provide verified symbols, definitions, references, and explicit implementations for TypeScript.

### Work

- discovery and root boundary;
- TypeScript Program/checker integration;
- declaration extraction and normalized kinds;
- semantic definition and reference traversal;
- explicit `implements`, `extends`, and abstract-method relationships;
- deterministic ranking and bounded output.

### Dependencies
Phase 0; TypeScript Compiler API; selected Node.js range.

### Evidence
TS-01 through TS-05 golden fixtures, false-positive tests, ambiguity tests, limit tests, and stable repeated output.

## Phase 2 — JavaScript

**Status: Proposed**

### Outcome
Reuse the TypeScript infrastructure for a documented JavaScript subset, including explicitly tested ESM/CommonJS behavior.

### Dependencies
Phase 1 and separate JS capability tests.

### Evidence
JavaScript fixture matrix and capability output that distinguishes full, partial, and unsupported cases.

## Phase 3 — Python

**Status: Proposed**

### Outcome
Add structured symbols and bounded import/reference heuristics without claiming Python type-checker-level semantics.

### Dependencies
Stable core contract; parser choice; import-resolution design.

### Evidence
Python fixtures with `strong`, `candidate`, and `unknown` results; dynamic behavior must never be reported as confirmed.

## Phase 4 — CFML

**Status: Proposed**

### Outcome
Support an explicit tag/script/component subset and honest lexical/parser-aware evidence.

### Dependencies
CFML syntax fixture set and parser strategy.

### Evidence
Tag and script function fixtures, documented unsupported runtime dispatch, and capability output that does not claim implementation resolution.

## Phase 5 — Ecosystem integration

**Status: Proposed**

### Outcome
Allow `agent-code-slice` and future agent tools to consume stable locators through the library API. Consider an optional MCP wrapper without moving reasoning into the core.

### Dependencies
Stable package API and installed-artifact verification.

### Evidence
Integration workflow test: symbol search → code slice; no mega-tool behavior.

## Phase 6 — Performance and release readiness

**Status: Proposed**

### Outcome
Measure bounded scaling and decide whether optimization is justified.

### Work

- small, medium, and large benchmark fixtures;
- cold/warm timing, files, bytes, memory, matches, and truncation metrics;
- package smoke tests on supported platforms;
- release and changelog review.

### Dependencies
A passing TypeScript implementation.

### Evidence
Committed benchmark report and release checklist. No latency PASS threshold is set before baseline measurement.

## Non-commitments

The project does not currently commit to fuzzy search, embeddings, a daemon, a persistent repository database, full call/dependency graphs, runtime tracing, code modification, natural-language queries, or automatic test selection.
