# agent-symbol-search v0.1.0 release checklist

| Field | Value |
|---|---|
| Status | Active |
| Owner | Project maintainers |
| Last reviewed | 2026-09-08 |
| Target | `agent-symbol-search@0.1.0` |
| Release mode | Public, unscoped npm package; local interactive publish |

This checklist is the release gate for `agent-symbol-search@0.1.0`. The repository may be release-ready before npm authentication, publication, Git tagging, and GitHub Release creation are performed. Do not describe the package as published until the registry and fresh-install checks below pass.

## Repository and CI gate

- [ ] Work on `codex/release-v0.1.0` from a synchronized `main`.
- [ ] Review the final diff and confirm no `dist`, tarball, `.npmrc`, npm token, OTP, or other secret is committed.
- [ ] Open a PR and wait for `.github/workflows/ci.yml` to pass on Ubuntu/Node 22, 24, and 26; package smoke on Ubuntu, macOS, and Windows with Node 24; and the Ubuntu/Node 24 benchmark job.
- [ ] Merge the PR and check out the exact green `origin/main` commit in a clean Node 24 LTS environment.

The supported Node.js majors are 22, 24, and 26. Node 20 and the local EOL Node 23 runtime are not release evidence.

## Local release gate

Run from the clean release commit:

```bash
npm ci
npm run release:check
npm audit --audit-level=high
npm pack --dry-run --json
git diff --check
git status --short
```

`release:check` runs `verify`, native Node coverage, packaged smoke, capability, benchmark, and documentation checks. Coverage measures product sources only and enforces lines ≥85%, functions ≥80%, and branches ≥75%. The benchmark gate requires every fixture to avoid `TIMEOUT` and keeps fixture file, byte, result, and status structure stable; v0.1.0 makes no public latency SLO.

The documented project-selection recovery command must succeed in this repository:

```bash
node dist/cli.js search --root . --project tsconfig.json --symbol SymbolSearchEngine
```

## Interactive npm publication

The package name is intentionally fixed and unscoped. Before publishing:

1. Confirm `npm view agent-symbol-search` is still a 404 and `node -p "require('./package.json').version"` is `0.1.0`.
2. Confirm the working tree is clean and CI is green for the exact commit.
3. Run `npm login` interactively. Then run only `npm whoami` to verify identity; never read or print `.npmrc`.
4. Publish with `npm publish --access public`. `prepublishOnly` repeats the release gate.
5. Do not claim npm provenance for this local first release. Trusted publishing/provenance is a follow-up for the next release.

If the package name is occupied, stop and ask the maintainer; do not rename automatically. If a publish command times out or has an uncertain result, query `npm view agent-symbol-search@0.1.0` before any retry. An existing version must never be republished.

## Post-publication verification

Only after npm reports success:

```bash
npm view agent-symbol-search@0.1.0 version dist-tags --json
npm install --prefix "$(mktemp -d)" --no-save --no-package-lock --ignore-scripts agent-symbol-search@0.1.0
```

In a fresh temporary directory, run the installed CLI and CommonJS API. Confirm the package is public and the README and MIT license are present. If registry and fresh-install verification pass, create and push annotated tag `v0.1.0`, then create the matching GitHub Release. The npm version, tag, GitHub Release, and source commit must be identical.

A failed pre-publication gate may be fixed and rerun without creating a tag. If npm publication succeeds but tagging or GitHub Release creation fails, retry only the Git/GitHub steps. Never overwrite `0.1.0`; publish `0.1.1` for a later fix, deprecating a defective version when appropriate.
