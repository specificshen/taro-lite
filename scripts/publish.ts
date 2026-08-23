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
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const packages = ['packages/taro-components', 'packages/taro', 'packages/taro-cli'];

// 从 argv 解析 --dry-run，透传给 bun publish
const dryRun = process.argv.includes('--dry-run');

// workspace 包名 → 当前版本，用于展开 workspace:* 协议
const workspaceVersions = new Map<string, string>();
for (const packageDir of packages) {
  const pkg: PackageJson = await Bun.file(`${packageDir}/package.json`).json();
  if (pkg.name && pkg.version) workspaceVersions.set(pkg.name, pkg.version);
}

/**
 * bun publish 的 workspace:* 转换从 bun.lock 取版本，而 bun 在依赖结构不变时
 * 不同步 workspace 包版本到 lockfile（1.4 实测），陈旧 lockfile 会把依赖发布成
 * 旧版本（2.0.0-alpha.1 曾因此被错写成 2.0.0-alpha.0，导致 cli 私有旧 runtime
 * 实例与业务侧分裂）。发布前显式改写为当前 workspace 版本，发布后恢复原文。
 * 返回恢复函数；无 workspace 协议依赖时不触碰文件。
 */
const expandWorkspaceProtocols = async (packageDir: string) => {
  const pkgPath = `${packageDir}/package.json`;
  const original = await Bun.file(pkgPath).text();
  const pkg: PackageJson = JSON.parse(original);
  let touched = false;

  for (const field of ['dependencies', 'peerDependencies'] as const) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const [dep, range] of Object.entries(deps)) {
      if (!range.startsWith('workspace:')) continue;
      const version = workspaceVersions.get(dep);
      if (!version) {
        throw new Error(`${pkgPath}: workspace 依赖 ${dep} 不在本次发布包集合内`);
      }
      deps[dep] = version;
      touched = true;
    }
  }

  if (!touched) return async () => {};
  await Bun.write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return async () => {
    await Bun.write(pkgPath, original);
  };
};

for (const packageDir of packages) {
  const packageJson: PackageJson = await Bun.file(`${packageDir}/package.json`).json();
  const name = packageJson.name ?? packageDir;
  const version = packageJson.version ?? '';
  // prerelease 版本走 next tag，正式版本走 latest tag
  const tag = version.includes('-') ? 'next' : 'latest';

  console.log(`\n▸ publish ${name}@${version} (tag: ${tag})${dryRun ? ' [dry-run]' : ''}`);
  const restore = await expandWorkspaceProtocols(packageDir);
  try {
    if (dryRun) {
      await $`bun publish --access public --tag ${tag} --dry-run`.cwd(packageDir);
    } else {
      await $`bun publish --access public --tag ${tag}`.cwd(packageDir);
    }
  } finally {
    await restore();
  }
}

console.log('\n所有包发布完成。');
