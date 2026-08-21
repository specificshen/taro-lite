import path from 'node:path';
import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/vite-compiler-context';
import type { PluginOption, Rolldown } from 'vite';
import { REG_NODE_MODULES, SCRIPT_EXT } from '../../helper';
import { isVirtualModule } from '../shared';

function isViteDepsPath(filePath: string) {
  const normalizedPath = path.normalize(filePath);

  // 判断路径是否包含 node_modules/.vite/deps
  const isViteDeps = normalizedPath.includes(path.join('node_modules', '.vite', 'deps'));

  return isViteDeps;
}

export default function (compiler: ViteMiniCompilerContext): PluginOption {
  const { taroConfig } = compiler;

  // 平台文件正则只依赖 taroConfig，插件创建时构造一次，避免每次 resolveId 现拼
  const allowedExts = Array.from(new Set(SCRIPT_EXT.concat(taroConfig.frameworkExts || [])))
    .map((item: string) => item.replace(/^\./, ''))
    .join('|');
  const miniPlatformReg = new RegExp(`\\.(weapp|mini)\\.(${allowedExts})`);

  // 「无平台变体」负缓存：key 为 source 相对 importer 解析出的目标文件绝对路径。
  // 只缓存 4 个平台变体候选全部解析失败的情况，命中后仍走原 specifier 的兜底解析。
  // 否定结果只会因「新增变体文件」而失效，buildStart 整表清空，watch 重建即全量重探，保守优先。
  const noPlatformVariantCache = new Set<string>();

  return {
    name: 'taro:vite-multi-platform-plugin',
    enforce: 'pre',
    buildStart() {
      noPlatformVariantCache.clear();
    },
    async resolveId(source, importer, options) {
      if (isVirtualModule(source)) return null;
      if (REG_NODE_MODULES.test(source)) return null;
      if (miniPlatformReg.test(source)) return null;
      if (!importer) return null;

      const ext = path.extname(source);
      const dir = path.dirname(source);
      const basename = path.basename(source, ext);

      // Note: H5 端的 dev 模式下，会存在 esbuild 预编译，会把 预编译的 chunk 文件放到 node_modules/.vite/deps 「cacheDir」 目录下，
      // 当时 vite 的源码里面有个钩子，会对改目录下的 resolveId 进行拦截处理，vitejs/vite/packages/vite/src/node/plugins/optimizedDeps.ts，会直接返回传入的 id，所以不会返回 null
      // 最全面的做法是，通过 config 钩子拿到 cacheDir，然后判断是否是 cacheDir 下的文件，如果是，则返回 null
      // 目前先简单处理一下，如果是 node_modules/.vite/deps 目录下 先返回 null
      const rawBasePath = path.resolve(path.dirname(importer), path.join(dir, basename));
      const rawResolvedPath = `${rawBasePath}${ext}`;
      if (isViteDepsPath(rawResolvedPath)) return null;

      let resolution: Rolldown.ResolvedId | null = null;

      if (!noPlatformVariantCache.has(rawResolvedPath)) {
        const miniExtList = [`.weapp${ext}`, `/index.weapp${ext}`, `.mini${ext}`, `/index.mini${ext}`];

        for (const multiExt of miniExtList) {
          resolution = await this.resolve(`${rawBasePath}${multiExt}`, importer, {
            ...options,
            skipSelf: true,
          });
          if (resolution) break;
        }

        if (!resolution) {
          noPlatformVariantCache.add(rawResolvedPath);
        }
      }

      if (!resolution) {
        resolution = await this.resolve(source, importer, {
          ...options,
          skipSelf: true,
        });
      }

      if (!resolution?.id || resolution.external) return resolution;
      if (isVirtualModule(resolution.id)) return resolution;
      if (REG_NODE_MODULES.test(resolution.id)) return resolution;
      if (miniPlatformReg.test(resolution.id)) return resolution;
    },
  };
}
