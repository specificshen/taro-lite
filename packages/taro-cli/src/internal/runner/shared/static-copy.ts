import { existsSync, statSync } from 'node:fs';
import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { PluginOption, ResolvedConfig } from 'vite';

export interface StaticCopyTarget {
  /** 源文件/目录（相对项目根目录） */
  src: string;
  /** 输出目录（相对 outDir） */
  dest: string;
  /** 文件重命名（仅当 src 为文件时生效） */
  rename?: string;
}

/**
 * 内置静态拷贝插件，替代 vite-plugin-static-copy。
 * 语义对齐 Taro 文档约定：from 为目录时拷贝其内容到 dest；from 为文件时拷贝到 dest 并可重命名。
 */
export function viteStaticCopy(targets: StaticCopyTarget[]): PluginOption {
  if (!targets.length) return [];

  let root = '';
  let outDir = '';

  return {
    name: 'taro:vite-static-copy',
    apply: 'build',
    configResolved(config: ResolvedConfig) {
      root = config.root;
      outDir = path.resolve(root, config.build.outDir);
    },
    buildStart() {
      for (const { src } of targets) {
        const abs = path.resolve(root, src);
        if (existsSync(abs)) this.addWatchFile(abs);
      }
    },
    async writeBundle() {
      for (const { src, dest, rename } of targets) {
        const srcAbs = path.resolve(root, src);
        if (!existsSync(srcAbs)) {
          throw new Error(`[taro:vite-static-copy] 找不到拷贝源：${srcAbs}`);
        }
        const destAbs = path.resolve(outDir, dest);
        if (statSync(srcAbs).isDirectory()) {
          await cp(srcAbs, destAbs, { recursive: true });
        } else {
          await mkdir(destAbs, { recursive: true });
          await cp(srcAbs, path.join(destAbs, rename ?? path.basename(srcAbs)));
        }
      }
    },
  };
}
