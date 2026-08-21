#!/usr/bin/env bun

/** @spcsn/taro-components 构建脚本（Bun.build，单入口字符串常量表）。 */
const result = await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: 'dist',
  format: 'esm',
  target: 'browser',
  sourcemap: 'external',
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log('Built dist (bun)');

export {};
