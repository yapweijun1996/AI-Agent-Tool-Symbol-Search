# agent-symbol-search Specification

| Field | Value |
|---|---|
| Status | Proposed |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |
| Runtime status | No implementation exists in the current repository |
| Compatibility | Proposed V1 contract; not yet released |

This is the normative target contract. It describes planned behavior, not currently available commands. Executable schemas and contract tests do not exist yet.

## 1. Product boundary

The tool is a deterministic, local-first, read-only symbol navigator. It returns bounded symbol evidence and source locations. It does not return full source bodies, execute project code, modify repositories, install dependencies, use a network, use an LLM, calculate change impact, or select tests.

## 2. Operations

V1.0 defines six operation names:

| Operation | Purpose | V1.0 target |
|---|---|---|
| `capabilities` | Report actual adapter and operation support | Contract only until implementation exists |
| `search` | Find declarations by exact, prefix, or substring name | TypeScript target |
| `definition` | Resolve a symbol declaration, optionally from a source position | TypeScript target |
| `references` | Find supported references to a symbol | TypeScript target |
| `implementations` | Find explicit inheritance/implementation relationships | TypeScript target |
| `symbols` | List declarations in one file/module | TypeScript target |

`search` searches parsed declarations, not comments or string literals. Exact matching is the default. Fuzzy search and user-supplied regex are not part of V1.0.

## 3. Requests

Every request requires an explicit `root`. The root is resolved and canonicalized before discovery. Operation-specific inputs are:

| Operation | Required | Optional |
|---|---|---|
| `capabilities` | `root` | none |
| `search` | `root`, `symbol` | `match` (`exact`/`prefix`/`substring`), `limit` |
| `definition` | `root`, `symbol` | `from`, `project`, `limit` |
| `references` | `root`, `symbol` | `from`, `project`, `limit` |
| `implementations` | `root`, `symbol` | `from`, `project`, `limit` |
| `symbols` | `root`, `path` | `project`, `limit` |

A source position is represented by separate fields rather than a colon-delimited CLI string so Windows drive letters are unambiguous:

```json
{
  "path": "src/cli.ts",
  "line": 82,
  "column": 4
}
```

`line` is 1-based. `column` is 0-based UTF-16. `from.path` must remain inside `root`.

The CLI syntax, when implemented, SHOULD expose `--from-path`, `--line`, and `--column` separately.

## 4. Normalized symbol kinds

Adapters MUST normalize to this set:

```text
module, namespace, class, interface, type, enum, function, method,
constructor, variable, constant, property, field, component, parameter, unknown
```

A language adapter MUST NOT invent a language-specific kind in the public result.

## 5. Relations and confidence

Allowed relations are:

```text
definition, declaration, reference, import_alias, implementation, inheritance
```

Allowed confidence values are:

```text
confirmed, strong, candidate, unknown
```

TypeScript compiler/checker evidence may be `confirmed`. AST/import evidence without complete semantic resolution is at most `strong`. Lexical or heuristic evidence is `candidate`. Unsupported or insufficient evidence is `unknown`. Documentation and output MUST NOT call heuristic evidence confirmed.

## 6. Result envelope

The target envelope is:

```json
{
  "schemaVersion": "1",
  "status": "complete",
  "data": {
    "matches": []
  },
  "diagnostics": [],
  "truncation": {
    "truncated": false,
    "reasons": []
  },
  "stats": {}
}
```

This example is illustrative until a maintained schema exists.

Allowed status values:

- `complete`: the requested bounded operation finished; an empty match set is valid;
- `partial`: results are available but discovery, parsing, resolution, or limits prevented complete coverage;
- `error`: the request could not produce a valid operation result.

`diagnostics` contains structured codes and paths where applicable. A parser failure in one file SHOULD produce a partial result when the remaining result is usable. Root validation and invalid requests produce `error`.

## 7. Match shape

The target match shape is:

```json
{
  "symbolId": "sha256-v1:...",
  "name": "resolveConfig",
  "qualifiedName": "config.resolveConfig",
  "kind": "function",
  "relation": "definition",
  "language": "typescript",
  "path": "src/config.ts",
  "range": {
    "start": { "line": 42, "column": 0 },
    "end": { "line": 58, "column": 1 }
  },
  "nameRange": {
    "start": { "line": 42, "column": 16 },
    "end": { "line": 42, "column": 29 }
  },
  "container": "config",
  "resolver": "typescript-semantic",
  "confidence": "confirmed",
  "exported": true
}
```

`range` is the declaration or reference range. Range ends are exclusive. `nameRange` and `container` may be omitted when unavailable. `exported` MUST be omitted when unknown; it must not be emitted as a false claim merely because an adapter lacks the information.

The tool returns locators, not source content. Code extraction belongs to `agent-code-slice`.

## 8. Symbol identity

The target identity is:

```text
SHA256(
  "symbol-id-v1" + "\n" +
  language + "\n" +
  normalized_repository_relative_path + "\n" +
  qualified_name + "\n" +
  kind + "\n" +
  normalized_signature
)
```

Paths use `/`, are repository-relative, and are normalized independently of host separator conventions. Line numbers are not part of identity. The normalization rules for qualified names and signatures MUST be implemented and tested before release.

## 9. Ranking and ordering

Results MUST be ordered deterministically by:

```text
confidence rank
→ relation quality
→ exact qualified-name match
→ exact simple-name match
→ same-module/import evidence
→ normalized path
→ start line
→ start column
→ symbolId
```

The numeric rank mapping is an implementation detail but must be fixed and tested. Locale-sensitive sorting is not allowed.

## 10. Ambiguity

Without enough context, multiple valid definitions are evidence of ambiguity, not permission to choose the first result. A definition request with multiple unresolved matches SHOULD return `status: "complete"` with `data.ambiguous: true` and all bounded matches. A source position may enable semantic resolution.

Example (illustrative):

```json
{
  "schemaVersion": "1",
  "status": "complete",
  "data": { "ambiguous": true, "matches": [] },
  "diagnostics": [],
  "truncation": { "truncated": false, "reasons": [] },
  "stats": {}
}
```

## 11. Capabilities

The target capability shape is operation-level and uses one vocabulary:

```json
{
  "schemaVersion": "1",
  "languages": {
    "typescript": {
      "operations": {
        "symbols": "full",
        "definitions": "full",
        "references": "full",
        "implementations": "partial"
      },
      "notes": []
    },
    "python": {
      "operations": {
        "symbols": "proposed",
        "definitions": "proposed",
        "references": "proposed",
        "implementations": "proposed"
      },
      "notes": []
    }
  }
}
```

Capability values are `full`, `partial`, `candidate`, `unsupported`, or `proposed`. Until executable capability output exists, this is a design target and no language is shipped.

## 12. Discovery and security

Default discovery MUST:

- stay inside the explicit root;
- avoid directory symlinks;
- respect documented `.gitignore` behavior;
- skip `.git`, `node_modules`, `dist`, `build`, `coverage`, `.cache`, generated/vendor directories when configured;
- skip `.env`, `.env.*`, `*.pem`, `*.key`, `credentials.*`, and `secrets.*` by default;
- treat project files as data and never import or execute them.

The exact ignore implementation and override behavior must be tested before release. Explicit paths cannot bypass root validation.

## 13. Resource limits

Initial proposed defaults:

```text
max files: 10,000
max single file: 2 MiB
max parsed bytes: 100 MiB
default result limit: 50
maximum result limit: 500
target timeout: 5 seconds
```

These are not verified benchmarks. Hitting a file, byte, result, or timeout budget MUST be represented in `truncation.reasons` and normally produce `status: "partial"`. A not-found result after complete scanning is `complete`, not `partial`.

## 14. Failure codes

The target codes are:

```text
SYMBOL_NOT_FOUND
AMBIGUOUS_SYMBOL
UNSUPPORTED_LANGUAGE
UNSUPPORTED_OPERATION
SEMANTIC_RESOLUTION_UNAVAILABLE
PARSE_ERROR
INVALID_ROOT
PATH_OUTSIDE_ROOT
MAX_FILES_REACHED
MAX_BYTES_REACHED
MAX_RESULTS_REACHED
TIMEOUT
INVALID_REQUEST
```

Codes and exit statuses are proposed until implementation and contract tests exist.

## 15. Compatibility and evidence

The public schema is versioned through `schemaVersion`. Breaking field, enum, range, identity, or ordering changes require a new schema version or an explicitly documented migration. The package version, compiler version, adapter, and effective project configuration SHOULD be included in diagnostics or stats when they affect resolution.

No command in this document is currently runnable. A release requires a clean-checkout setup command, a package/installed-artifact smoke command, schema validation, golden fixtures, bounds tests, and read-only verification.
