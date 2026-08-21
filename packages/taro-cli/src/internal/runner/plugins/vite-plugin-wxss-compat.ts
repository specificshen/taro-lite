import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/vite-compiler-context';
import type { PluginOption, Rolldown } from 'vite';
import { transformWxss } from '../style-transforms/wxss-compat';

/**
 * 对小程序 `.wxss` 产物做 WXSS 兼容性兜底处理。
 *
 * 注册在 `taro:vite-style` 之后、`taro:vite-mini-emit` 之前，
 * 确保 `.css` 已重命名为 `.wxss` 且公共样式合并完成后执行。
 */
export default function (viteCompilerContext: ViteMiniCompilerContext): PluginOption {
  return {
    name: 'taro:vite-wxss-compat',
    generateBundle(_opts, bundle) {
      if (!viteCompilerContext) return;

      const styleExt = viteCompilerContext.fileType.style;
      for (const name in bundle) {
        const chunk = bundle[name];
        if (chunk.type !== 'asset') continue;

        // style 插件会把 Vite 生成的 .css 重命名为 .wxss（修改 chunk.fileName），
        // 但 bundle 的 key 仍是原来的 .css，因此要以 chunk.fileName 为准。
        const fileName = chunk.fileName ?? name;
        if (!fileName.endsWith(styleExt)) continue;

        try {
          const source = String(chunk.source);
          const { css, warnings } = transformWxss(source);
          (chunk as Rolldown.OutputAsset).source = css;

          for (const warning of warnings) {
            this.warn(warning);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.warn(`WXSS compat processing failed for ${name}: ${message}`);
        }
      }
    },
  };
}
