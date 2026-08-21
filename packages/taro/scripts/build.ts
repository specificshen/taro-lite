#!/usr/bin/env bun

/**
 * @spcsn/taro 构建脚本（Bun.build）。
 * 双入口（index + runtime/index）、feature flag define、react external。
 * --watch：监听 src 变更增量重建 JS（d.ts 仅在启动时生成一次）。
 */
import { watch } from 'node:fs';

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

async function buildJs() {
  const result = await Bun.build({
    entrypoints: ['src/index.ts', 'src/runtime/index.ts'],
    outdir: 'dist',
    format: 'esm',
    target: 'browser',
    splitting: true,
    sourcemap: 'external',
    external: ['react'],
    define: {
      ENABLE_CLONE_NODE: 'false',
      ENABLE_CONTAINS: 'false',
      ENABLE_SIZE_APIS: 'false',
      ENABLE_TEMPLATE_CONTENT: 'false',
      ENABLE_MUTATION_OBSERVER: 'false',
    },
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    if (!isWatch) process.exit(1);
    return false;
  }
  return true;
}

// d.ts 仍由 tsc 生成（Bun 不产 d.ts）
await import('./build-dts');

if (await buildJs()) {
  console.log('Built dist (bun)');
}

if (isWatch) {
  let timer: Timer | undefined;
  watch('src', { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log('Rebuilding...');
      buildJs();
    }, 50);
  });
  console.log('Watching src for changes...');
}
