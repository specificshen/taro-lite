---
name: release-binding-preparer
description: Use when preparing releases, aligning versions, or checking publish readiness of the public @spcsn packages.
---

## Release Binding Preparer

Use this skill when preparing a release, changing versions, or checking publish readiness of the public `@spcsn` packages in `taro-lite`.

### Release model

- `@spcsn` packages are intended to be published and installed as a consistent group.
- Current stable line starts at `1.0.0` and does not map to upstream Taro `4.x`.
- Public packages must keep versions aligned with the root `package.json` version.
- The publish surface is exactly three packages; there are no native binding or platform packages anymore.

### Publish surface

Published in dependency order by `scripts/publish.ts`:

- `@spcsn/taro-components` -> `packages/taro-components`
- `@spcsn/taro` -> `packages/taro`
- `@spcsn/taro-cli` -> `packages/taro-cli`

Prerelease versions (e.g. `2.0.0-alpha.0`) publish under the `next` tag; stable versions publish under `latest`.

### Readiness checks

Use these commands from the repo root:

```bash
bun run build
bun run release:check
bun packages/taro-cli/bin/taro --version
```

`release:check` validates public package versions, the publish surface, dependency boundaries, and the README/docs/fixture/template contracts.

### Publishing workflow

1. Confirm registry and auth:
   - `npm config get registry`
   - `npm whoami`
2. Build packages:
   - `bun run build`
3. Run release readiness:
   - `bun run release:check`
4. Dry-run publish before real publish:
   - `bun scripts/publish.ts --dry-run`
5. Publish for real only after the dry-run output is correct:
   - `bun scripts/publish.ts`

### Safety rules

- Do not advise partial replacement of only CLI, runtime, or one plugin package unless the user explicitly wants a risky workaround.
- After publishing, validate a real business project by switching its `@spcsn/*` dependencies to the published npm versions and running its build.
