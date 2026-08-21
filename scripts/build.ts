#!/usr/bin/env bun

/**
 * 按依赖顺序构建所有需要预构建的 workspace 包。
 * @spcsn/taro-cli 的源码直接 import '@spcsn/taro/runtime'（指向 dist），
 * 因此 taro 必须先完成构建；cli 自身为 Bun-only，bin 直跑 src/*.ts，无需构建。
 */
import { $ } from 'bun';

const packages = ['packages/taro-components', 'packages/taro'];

for (const packageDir of packages) {
  console.log(`\n▸ build ${packageDir}`);
  await $`bun run build`.cwd(packageDir);
}
