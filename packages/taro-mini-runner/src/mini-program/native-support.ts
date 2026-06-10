import path from 'node:path';
import { fs } from '@spcsn/taro-helper';
import sax from 'sax';
import { normalizePath } from 'vite';
import { isRelativePath, isVirtualModule } from '../shared';
import { componentConfig } from '../shared/component';
import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/viteCompilerContext';
import type { PluginOption, Rolldown } from 'vite';

const QUERY_IS_NATIVE_SCRIPT = '?isNativeScript=';
export const QUERY_IS_NATIVE_PAGE = QUERY_IS_NATIVE_SCRIPT + 'page';
export const QUERY_IS_NATIVE_COMP = QUERY_IS_NATIVE_SCRIPT + 'comp';
const IS_NATIVE_SCRIPT_REG = new RegExp(`\\${QUERY_IS_NATIVE_SCRIPT}(page|comp)$`);
const QUERY_IS_NATIVE_STYLE = '?isNativeStyle=true';
const IS_NATIVE_STYLE_REG = new RegExp(`\\${QUERY_IS_NATIVE_STYLE}`);

export default function (viteCompilerContext: ViteMiniCompilerContext | undefined): PluginOption {
  const { taroConfig } = viteCompilerContext as ViteMiniCompilerContext;
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
    moduleParsed(moduleInfo) {
      const { id } = moduleInfo;
      let ast;
      try {
        ast = moduleInfo.ast;
      } catch {
        return;
      }

      if (!isVirtualModule(id) && /\.[jt]sx/.test(id)) {
        const walk = require('acorn-walk');

        walk.simple(ast, {
          CallExpression: (node) => {
            const callee = node.callee;
            if (callee.type === 'MemberExpression') {
              if (callee.property.name !== 'createElement') {
                return;
              }
            } else {
              const nameOfCallee = callee.name;
              if (!/_?jsxs?/.test(nameOfCallee) && !nameOfCallee?.includes('createElement')) {
                return;
              }
            }

            const [type, prop] = node.arguments;
            const componentName = type.name;

            type.value && taroConfig.onParseCreateElement?.(type.value, componentConfig);

            if (componentName === 'CustomWrapper' && !componentConfig.thirdPartyComponents.get('custom-wrapper')) {
              componentConfig.thirdPartyComponents.set('custom-wrapper', new Set());
            }
            if (componentConfig.thirdPartyComponents.size === 0) {
              return;
            }
            const attrs = componentConfig.thirdPartyComponents.get(type.value);

            if (attrs == null || !prop || prop.type !== 'ObjectExpression') {
              return;
            }

            prop.properties
              .filter(
                (p) =>
                  p.type === 'Property' &&
                  p.key.type === 'Identifier' &&
                  p.key.name !== 'children' &&
                  p.key.name !== 'id',
              )
              .forEach((p) => attrs.add(p.key.name));
          },
        });
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
