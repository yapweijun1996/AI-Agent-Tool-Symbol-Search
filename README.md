# agent-symbol-search

| Field | Value |
|---|---|
| Status | Proposed |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |
| Current release | None |

> Deterministic, local-first, read-only symbol navigation for AI coding agents.

## Current status

This repository is a documentation-only initial baseline. There is currently no installable package, CLI, library API, supported language implementation, or runnable example. The documents describe the proposed V1 contract and delivery plan; they do not claim shipped capability.

## Intended problem

The project is intended to answer focused navigation questions such as:

- Where is `buildProject` defined?
- Who references `ProjectProfile`?
- Which class explicitly implements `StorageAdapter`?
- What symbols exist in this file?

It is designed to locate code, not dump source. `agent-code-slice` is expected to read the returned ranges.

## Planned V1.0

The first implementation targets TypeScript symbols, definitions, references, and explicit implementation/inheritance relationships. JavaScript, Python, and CFML are later roadmap phases and are not supported today.

The planned tool is read-only: it will parse project files as data and will not execute code, install dependencies, build, test, modify repositories, use a network, or call an LLM.

## Planned example

The following is illustrative and is **not runnable in the current checkout**:

```bash
agent-symbol-search definition \
  --root . \
  --symbol resolveConfig \
  --from-path src/cli.ts \
  --line 82 \
  --json
```

See [`SPEC.md`](./SPEC.md) for the proposed contract and [`TASK.md`](./TASK.md) for implementation status.

## Documentation

- [`DESIGN.md`](./DESIGN.md) — architecture and boundaries
- [`SPEC.md`](./SPEC.md) — proposed normative contract
- [`EPIC.md`](./EPIC.md) — TypeScript vertical-slice outcome
- [`ROADMAP.md`](./ROADMAP.md) — sequenced future work
- [`TASK.md`](./TASK.md) — active implementation tasks
- [`CHANGELOG.md`](./CHANGELOG.md) — historical/release notes
- [`DOCUMENTATION_STANDARD.md`](./DOCUMENTATION_STANDARD.md) — documentation governance
