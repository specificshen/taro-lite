# Release Dependency Auditor

Use this skill when preparing a release, bumping versions, or modifying dependencies in the `@spcsn/taro-lite` monorepo. It prevents unsafe or inconsistent dependencies from being shipped.

## Why this matters

Publishing with the wrong dependency graph can break consumers even if local tests pass. Historical example: `html-minifier` was used to collapse WXML whitespace, but it treats `<input>` as an HTML void element and strips/rewrites its closing tag, causing WeApp to fail with `expect end-tag input`. It has been removed.

## Audit checklist

Run through this list before every release or dependency change.

### 1. Platform-unsafe runtime dependencies

- WXML/WXSS are not HTML/CSS. Do not ship HTML/CSS-only tools as runtime/build dependencies unless they are proven safe for WeApp output.
- If a dependency mutates markup, verify it preserves WeApp-required closing tags (e.g. `<input></input>`, `<image></image>`).
- When in doubt, remove the dependency and the feature flag rather than risking runtime black screens.

### 2. Workspace dependency wiring

- Internal `@spcsn/*` packages must reference each other with `"workspace:*"` in `dependencies` / `devDependencies`.
- Public packages must not contain `"link:"` or `"file:"` dependencies (fixtures can, because they are `private: true`).
- `peerDependencies` versions must match the current release line (e.g. `"@spcsn/taro-components": "^1.1.0"` when releasing `1.1.0`).

### 3. Missing type declarations

- Adding/removing packages can prune phantom `@types/*` packages from `node_modules` even if they are not in `bun.lock`.
- If `tsc` reports `Could not find a declaration file for module '...'`, add the corresponding `@types/*` package to the package that imports it.
- Example: `@babel/generator` and `@babel/traverse` need `@types/babel__generator` and `@types/babel__traverse`.

### 4. Version alignment

- Root `package.json` version and all publishable `@spcsn/*` package versions must be identical.
- README installation examples and test fixture dependencies must match the release version.
- Use `release-binding-preparer` for publish-surface and version alignment.

## Verification commands

From the repo root:

```bash
# Reinstall to make sure lockfile reflects the declared graph
bun install

# Full validation
bun run typecheck
bun run build
bun run test
bun run release:check
```

## What to do if release:check fails

1. Read the exact failure message.
2. If it is a version mismatch, update the offending `package.json` and re-run `bun install`.
3. If it is a dependency audit failure, fix the graph and remove the unsafe package/code before continuing.
