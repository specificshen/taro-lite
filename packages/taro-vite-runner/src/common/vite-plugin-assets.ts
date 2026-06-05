import * as path from 'node:path';

import { fs, REG_FONT, REG_IMAGE, REG_MEDIA } from '@spcsn/taro-helper';
import { isBoolean, isString } from '@spcsn/taro-shared';

import { isVirtualModule } from '../utils';

import type { IUrlLoaderOption } from '@spcsn/taro/types/compile';
import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/viteCompilerContext';
import type { PluginOption, ResolvedConfig } from 'vite';

const rawRE = /(?:\?|&)raw(?:&|$)/;
const urlRE = /(\?|&)url(?:&|$)/;
const queryRE = /\?.*$/s;
const hashRE = /#.*$/s;

const cleanUrl = (url: string): string => url.replace(hashRE, '').replace(queryRE, '');

const ASSET_MIME_TYPES: Record<string, string> = {
  '.aac': 'audio/aac',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getAssetMimeType(id: string): string {
  return ASSET_MIME_TYPES[path.extname(cleanUrl(id)).toLowerCase()] ?? 'application/octet-stream';
}

export default function (viteCompilerContext: ViteMiniCompilerContext): PluginOption {
  const { taroConfig, sourceDir } = viteCompilerContext;
  let resolvedConfig: ResolvedConfig;
  const assetsCache: WeakMap<ResolvedConfig, Map<string, string>> = new WeakMap();
  return {
    name: 'taro:vite-assets',
    enforce: 'pre',
    configResolved(config) {
      resolvedConfig = config;
    },
    buildStart() {
      assetsCache.set(resolvedConfig, new Map());
    },
    async load(id) {
      if (isVirtualModule(id)) return;
      if (rawRE.test(id) || urlRE.test(id)) return;

      id = cleanUrl(id);
      if (!resolvedConfig.assetsInclude(id)) return;

      const cache = assetsCache.get(resolvedConfig);
      const cachedValue = cache?.get(id);
      if (isString(cachedValue)) {
        return cachedValue;
      }

      const source = fs.readFileSync(id);

      const { imageUrlLoaderOption = {}, fontUrlLoaderOption = {}, mediaUrlLoaderOption = {} } = taroConfig;

      let limit: number | boolean;

      let options: IUrlLoaderOption = {};

      if (REG_IMAGE.test(id)) {
        options = imageUrlLoaderOption;
        limit = options.limit as number | boolean;
      } else if (REG_FONT.test(id)) {
        options = fontUrlLoaderOption;
        limit = options.limit as number | boolean;
      } else if (REG_MEDIA.test(id)) {
        options = mediaUrlLoaderOption;
        limit = options.limit as number | boolean;
      } else {
        return;
      }
      const isEsModule = isBoolean(options.esModule) ? options.esModule : true;

      let url: string;
      if (limit === true || (typeof limit === 'number' && source.length < limit)) {
        const mimeType = getAssetMimeType(id);
        url = `data:${mimeType};base64,${source.toString('base64')}`;
      } else {
        let fileName = id.replace(sourceDir + '/', '');
        if (typeof options.name === 'function') {
          fileName = options.name(id);
        }
        const referenceId = this.emitFile({
          type: 'asset',
          fileName,
          source: Uint8Array.from(source),
        });
        url = `__VITE_ASSET__${referenceId}__`;
      }

      cache?.set(id, url);

      return isEsModule ? `export default "${url}"` : `module.exports = "${url}"`;
    },
  };
}
