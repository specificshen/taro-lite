import path from 'node:path';
import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/vite-compiler-context';
import sax from 'sax';
import type { PluginOption, Rolldown } from 'vite';
import { normalizePath } from 'vite';
import { fs } from '../../helper';
import { isRelativePath } from '../shared';

const QUERY_IS_NATIVE_SCRIPT = '?isNativeScript=';
export const QUERY_IS_NATIVE_PAGE = QUERY_IS_NATIVE_SCRIPT + 'page';
export const QUERY_IS_NATIVE_COMP = QUERY_IS_NATIVE_SCRIPT + 'comp';
const IS_NATIVE_SCRIPT_REG = new RegExp(`\\${QUERY_IS_NATIVE_SCRIPT}(page|comp)$`);
const QUERY_IS_NATIVE_STYLE = '?isNativeStyle=true';
const IS_NATIVE_STYLE_REG = new RegExp(`\\${QUERY_IS_NATIVE_STYLE}`);

export default function (viteCompilerContext: ViteMiniCompilerContext | undefined): PluginOption {
  return {
    name: 'taro:vite-native-support',
    enforce: 'pre',
    buildEnd() {
      viteCompilerContext = undefined;
    },
    resolveId(id) {
      if (!viteCompilerContext) return;
      if (IS_NATIVE_STYLE_REG.test(id)) {
        return id;
      }
    },
    async load(id) {
      if (!viteCompilerContext) return;

      if (IS_NATIVE_SCRIPT_REG.test(id)) {
        let type: 'page' | 'comp' = 'page';
        const target = id.replace(IS_NATIVE_SCRIPT_REG, (_, $1) => {
          type = $1;
          return '';
        });

        let stylePath = '';

        if (type === 'page') {
          for (const page of viteCompilerContext.pages) {
            if (page.isNative && page.scriptPath === target && page.cssPath && fs.existsSync(page.cssPath)) {
              stylePath = viteCompilerContext.getTargetFilePath(page.cssPath, '.css');
              break;
            }
          }
        } else {
          for (const comp of viteCompilerContext.nativeComponents.values()) {
            if (comp.scriptPath === target && comp.cssPath && fs.existsSync(comp.cssPath)) {
              stylePath = viteCompilerContext.getTargetFilePath(comp.cssPath, '.css');
              break;
            }
          }
        }

        if (stylePath) {
          return {
            code: [`import "${target}";\n`, stylePath ? `import "${stylePath}${QUERY_IS_NATIVE_STYLE}";\n` : ''].join(
              '',
            ),
          };
        }
      } else if (IS_NATIVE_STYLE_REG.test(id)) {
        let source = id.replace(new RegExp(`\\${QUERY_IS_NATIVE_STYLE}`), '');
        source = viteCompilerContext.getTargetFilePath(source, viteCompilerContext.fileType.style);
        const code = fs.readFileSync(source, 'utf-8');
        return {
          code,
        };
      }
    },
  };
}

export function miniTemplateLoader(ctx: Rolldown.PluginContext, templatePath: string, sourceDir: string): string {
  const source = fs.readFileSync(templatePath).toString();

  // sax 非严格模式要求单一根节点，小程序模板片段需要包一层后再解析依赖。
  const sourceWithRoot = `<root>${source}</root>`;
  const parser = sax.parser(false, { lowercase: true });
  const requests: string[] = [];

  parser.onattribute = ({ name, value }) => {
    if (name === 'src' && isRelativePath(value)) {
      const request = path.resolve(path.dirname(templatePath), value);
      requests.push(normalizePath(request));
    }
  };

  parser.onend = () => {
    for (const request of requests) {
      ctx.emitFile({
        type: 'asset',
        fileName: request.replace(sourceDir, '').replace(/^\//, ''),
        source: Uint8Array.from(fs.readFileSync(request)),
      });
      ctx.addWatchFile(request);
    }
  };

  parser.write(sourceWithRoot).close();

  ctx.addWatchFile(templatePath);

  return source;
}
