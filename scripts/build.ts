#!/usr/bin/env bun

/**
 * 按依赖顺序构建所有 workspace 包。
 * @spcsn/taro-cli 的源码直接 import '@spcsn/taro/runtime'（指向 dist），
 * 因此 taro 必须先于 cli 完成构建。
 */
import { $ } from 'bun';

const packages = ['packages/taro-components', 'packages/taro', 'packages/taro-cli'];

for (const packageDir of packages) {
  console.log(`\n▸ build ${packageDir}`);
  await $`bun run build`.cwd(packageDir);
}
