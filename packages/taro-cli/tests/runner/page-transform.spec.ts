import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/vite-compiler-context';
import { transformNativeComponents } from '../../src/internal/runner/mini-program/page';
import { UniqueKeyMap } from '../../src/internal/runner/shared/map';

const stubContext = {
  resolvePageImportPath: (_id: string, importPath: string) => importPath,
} as unknown as ViteMiniCompilerContext;

function setupFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taro-page-transform-'));
  // 组件路径相对页面文件解析（pages/index.tsx → pages/native/comp.tsx）
  fs.mkdirSync(path.join(dir, 'pages', 'native'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'pages', 'native', 'comp.tsx'), 'export default function Comp() {}');
  return { dir, id: path.join(dir, 'pages', 'index.tsx') };
}

describe('transformNativeComponents', () => {
  it('rewrites importNativeComponent calls into component keys', () => {
    const { id } = setupFixture();
    const code = [
      `const Comp = importNativeComponent('./native/comp', 'my-comp');`,
      `export default function Page() { return <Comp />; }`,
    ].join('\n');
    const scopeNativeComp = new Map<string, string>();
    const result = transformNativeComponents(code, id, stubContext, new UniqueKeyMap(), scopeNativeComp);

    expect(result.enableImportComponent).toBe(true);
    expect(result.code).toContain('const Comp = "my-comp";');
    expect([...scopeNativeComp.keys()]).toEqual(['my-comp']);
    expect(scopeNativeComp.get('my-comp')!.split(path.sep).join('/')).toMatch(/native\/comp\.tsx$/);
  });

  it('skips modules that locally bind importNativeComponent', () => {
    const { id } = setupFixture();
    const code = [
      `import { importNativeComponent } from './shim';`,
      `const Comp = importNativeComponent('./native/comp', 'my-comp');`,
    ].join('\n');
    const result = transformNativeComponents(code, id, stubContext, new UniqueKeyMap(), new Map());

    expect(result.enableImportComponent).toBe(false);
    expect(result.code).toBe(code);
  });

  it('collects used internal components from JSX', () => {
    const { id } = setupFixture();
    const code = `export default function Page() { return <View className="x"><Text /><Custom.View /></View>; }`;
    const result = transformNativeComponents(code, id, stubContext, new UniqueKeyMap(), new Map());

    expect([...(result.usedComponents ?? [])].sort()).toEqual(['text', 'view']);
  });

  it('erases definePageConfig calls in .config files', () => {
    const { id } = setupFixture();
    const configId = id.replace('index.tsx', 'index.config.ts');
    const code = `export default definePageConfig({ navigationBarTitleText: 'x' });`;
    const result = transformNativeComponents(code, configId, stubContext, new UniqueKeyMap(), new Map());

    expect(result.code).not.toContain('definePageConfig');
  });
});
