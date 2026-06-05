---
name: spcsn-taro-lite-release-binding
description: Use for @spcsn Taro Lite release preparation, version alignment, native binding artifacts, platform packages, and publish readiness checks.
---

## SPCSN Taro Lite Release And Binding Workflow

Use this skill when preparing a release, changing versions, touching `@spcsn/taro-binding`, modifying `npm/*` platform packages, or checking publish readiness in `taro-lite`.

### Release model

- `@spcsn` packages are intended to be published and installed as a consistent group.
- Current stable line starts at `1.0.0` and does not map to upstream Taro `4.x`.
- Public packages must keep versions aligned with the root `package.json` version.
- Native binding packages must be released with the CLI/bottom packages because install-time binding resolution depends on them.

### Binding package map

Core package:

- `crates/native_binding` publishes `@spcsn/taro-binding`.

Platform packages under `npm/*`:

- `@spcsn/taro-binding-darwin-arm64` -> `npm/darwin-arm64`
- `@spcsn/taro-binding-darwin-x64` -> `npm/darwin-x64`
- `@spcsn/taro-binding-linux-arm64-gnu` -> `npm/linux-arm64-gnu`
- `@spcsn/taro-binding-linux-x64-gnu` -> `npm/linux-x64-gnu`
- `@spcsn/taro-binding-linux-x64-musl` -> `npm/linux-x64-musl`
- `@spcsn/taro-binding-win32-x64-msvc` -> `npm/win32-x64-msvc`

### Readiness checks

Use these commands from the repo root:

```bash
pnpm run release:check -- --skip-bindings
pnpm run artifacts
pnpm run release:check
node packages/taro-cli/bin/taro --version
```

`release:check` validates public package versions and, unless `--skip-bindings` is provided, verifies expected `.node` artifacts in platform packages.

### Publishing workflow

1. Confirm registry and auth:
   - `npm config get registry`
   - `npm whoami`
2. Build packages:
   - `pnpm run build`
3. Prepare native binding artifacts:
   - `pnpm run artifacts`
4. Run full release readiness:
   - `pnpm run release:check`
5. Dry-run publish before real publish:
   - `pnpm -r --filter './packages/*' --filter './npm/*' --filter './crates/native_binding' publish --access public --tag latest --dry-run`
6. Only publish for real after dry-run output and binding artifacts are correct.

### Safety rules

- If `release:check` reports a missing `.node` file, do not publish that platform package.
- Do not advise partial replacement of only CLI, runtime, or one plugin package unless the user explicitly wants a risky workaround.
- After publishing, validate a real business project by switching local `link:` dependencies to npm versions and running `npm run build`.
