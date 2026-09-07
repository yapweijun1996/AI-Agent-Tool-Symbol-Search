# Epic: TypeScript Symbol Navigation Vertical Slice

| Field | Value |
|---|---|
| Status | Proposed |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |
| Epic ID | SS-V1-TS |
| Current state | Blocked on implementation bootstrap; repository is documentation-only |

## Outcome

Deliver the first usable `agent-symbol-search` vertical slice: a local, read-only TypeScript tool that returns small, deterministic, evidence-backed symbol locations for an AI coding agent.

The outcome is not a universal code-intelligence platform. It is a verified TypeScript foundation that later language adapters can reuse.

## Scope

### In scope

- Node.js/TypeScript package bootstrap;
- versioned request/result types and schemas;
- repository discovery with root and secret boundaries;
- TypeScript symbols;
- definitions;
- references and import aliases where compiler/checker evidence supports them;
- explicit `implements`, `extends`, and abstract-method implementation relationships;
- CLI and library API over one core;
- bounded, deterministic results;
- golden, security, limit, package, and read-only tests.

### Out of scope

- Python and CFML implementation;
- fuzzy or regex search;
- persistent repository cache;
- code slicing, change impact, test selection, MCP runtime;
- project code execution or dependency installation;
- structural TypeScript implementation inference beyond the explicitly supported subset;
- release or performance guarantees before measurement.

## Definition of done

This epic is complete only when all of the following are true:

1. A clean checkout can install and run the documented package.
2. TypeScript fixtures pass exact definition, alias, method, implementation, ambiguity, and false-positive tests.
3. The result envelope, ranges, symbol IDs, confidence values, errors, limits, and ordering are schema-tested.
4. Root validation, symlink handling, ignored/secrets handling, no-write, no-network, and no-execution invariants are verified.
5. `npm pack` or equivalent installed-artifact smoke tests pass outside the source checkout.
6. Cold/warm benchmark output is recorded without claiming an unmeasured latency target.
7. README, DESIGN, SPEC, ROADMAP, TASK, and CHANGELOG agree with executable behavior.

## Workstreams

| Workstream | Status | Dependency |
|---|---|---|
| Contract and schema | Proposed | None |
| Package/tool bootstrap | Proposed | Contract decisions |
| Discovery and security | Proposed | Package bootstrap |
| TypeScript adapter | Proposed | Contract, TypeScript dependency |
| CLI/library integration | Proposed | Core adapter |
| Verification and fixtures | Proposed | Each implemented operation |
| Packaging and benchmarks | Proposed | Passing tests |

## Current blockers

- No `package.json`, source tree, test runner, schema, fixture, or runtime exists.
- TypeScript project selection rules are not yet executable or tested.
- Dependency versions and supported Node.js range have not been selected.
- No baseline precision, latency, memory, or scaling measurements exist.

## Decisions recorded

- TypeScript is the V1.0 language priority.
- Python and CFML are later adapters, not current capabilities.
- The tool is read-only, local-first, and does not execute project code.
- No persistent repository cache is planned for V1.0.
- `agent-code-slice` remains responsible for source extraction.
- Ambiguity and partial results are reported rather than hidden.

## Evidence required for closure

Every workstream must attach executable evidence to its task before it is marked complete. Documentation alone cannot close an implementation task.
