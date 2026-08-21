#!/usr/bin/env bun

/**
 * 按依赖顺序发布所有公开 workspace 包。
 * 版本含 `-`（prerelease，如 2.0.0-alpha.0）时发布到 next tag，
 * 否则发布到 latest tag。传入 --dry-run 时仅演练，不真正发布。
 *
 * 认证方式：bun publish 复用 npm 配置，发布前需在 ~/.npmrc 写入
 * //registry.npmjs.org/:_authToken（见 .github/workflows/publish.yml）。
 * @spcsn/taro / @spcsn/taro-components 通过 prepack 钩子自动执行构建；
 * @spcsn/taro-cli 为 Bun-only 包，直接发布 src 下的 TS 源码，无需构建。
 */
import { $ } from 'bun';

type PackageJson = {
  name?: string;
  version?: string;
};

const packages = ['packages/taro-components', 'packages/taro', 'packages/taro-cli'];

// 从 argv 解析 --dry-run，透传给 bun publish
const dryRun = process.argv.includes('--dry-run');

for (const packageDir of packages) {
  const packageJson: PackageJson = await Bun.file(`${packageDir}/package.json`).json();
  const name = packageJson.name ?? packageDir;
  const version = packageJson.version ?? '';
  // prerelease 版本走 next tag，正式版本走 latest tag
  const tag = version.includes('-') ? 'next' : 'latest';

  console.log(`\n▸ publish ${name}@${version} (tag: ${tag})${dryRun ? ' [dry-run]' : ''}`);
  if (dryRun) {
    await $`bun publish --access public --tag ${tag} --dry-run`.cwd(packageDir);
  } else {
    await $`bun publish --access public --tag ${tag}`.cwd(packageDir);
  }
}

console.log('\n所有包发布完成。');
