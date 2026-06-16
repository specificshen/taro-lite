import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/viteCompilerContext';
import type { Rolldown } from 'vite';
import { describe, expect, it, } from 'vitest';
import wxssCompatPlugin from '../../src/plugins/vite-plugin-wxss-compat';

describe('vite-plugin-wxss-compat', () => {
  function createContext(styleExt = '.wxss'): ViteMiniCompilerContext {
    return {
      fileType: { style: styleExt },
    } as ViteMiniCompilerContext;
  }

  function callGenerateBundle(plugin: ReturnType<typeof wxssCompatPlugin>, bundle: Rolldown.OutputBundle) {
    const warnings: string[] = [];
    const context = {
      warn(message: string) {
        warnings.push(message);
      },
    };
    // @ts-expect-error plugin shape is valid
    plugin.generateBundle.call(context, {}, bundle);
    return warnings;
  }

  it('processes assets whose fileName ends with the native style extension', () => {
    const plugin = wxssCompatPlugin(createContext());
    const bundle: Rolldown.OutputBundle = {
      'style.css': {
        type: 'asset',
        fileName: 'pages/index/index.wxss',
        source: '.flex > *{flex:1;color:#111f2c8f}',
      } as Rolldown.OutputAsset,
    };

    callGenerateBundle(plugin, bundle);

    const asset = bundle['style.css'] as Rolldown.OutputAsset;
    expect(asset.source).toContain('rgba(17, 31, 44, 0.56)');
    expect(asset.source).toContain('.flex > view,');
    expect(asset.source).not.toContain('> *');
  });

  it('skips assets that are not style files', () => {
    const plugin = wxssCompatPlugin(createContext());
    const bundle: Rolldown.OutputBundle = {
      'app.js': {
        type: 'chunk',
        fileName: 'app.js',
        code: 'console.log("hello")',
      } as unknown as Rolldown.OutputAsset,
      'style.css': {
        type: 'asset',
        fileName: 'style.css',
        source: '.flex > *{flex:1}',
      } as Rolldown.OutputAsset,
    };

    callGenerateBundle(plugin, bundle);

    expect((bundle['style.css'] as Rolldown.OutputAsset).source).toBe('.flex > *{flex:1}');
  });

  it('processes assets when bundle key already matches the style extension', () => {
    const plugin = wxssCompatPlugin(createContext());
    const bundle: Rolldown.OutputBundle = {
      'common.wxss': {
        type: 'asset',
        fileName: 'common.wxss',
        source: '.foo{color:#ffffffff}',
      } as Rolldown.OutputAsset,
    };

    callGenerateBundle(plugin, bundle);

    expect((bundle['common.wxss'] as Rolldown.OutputAsset).source).toBe('.foo{color:rgba(255, 255, 255, 1)}');
  });

  it('emits warnings returned by transformWxss', () => {
    const plugin = wxssCompatPlugin(createContext());
    const bundle: Rolldown.OutputBundle = {
      'style.css': {
        type: 'asset',
        fileName: 'pages/index/index.wxss',
        source: '.flex > *{flex:1}',
      } as Rolldown.OutputAsset,
    };

    const warnings = callGenerateBundle(plugin, bundle);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('.flex > *');
  });

  it('does nothing when vite compiler context is missing', () => {
    const plugin = wxssCompatPlugin(undefined as unknown as ViteMiniCompilerContext);
    const bundle: Rolldown.OutputBundle = {
      'style.css': {
        type: 'asset',
        fileName: 'pages/index/index.wxss',
        source: '.flex > *{flex:1}',
      } as Rolldown.OutputAsset,
    };

    callGenerateBundle(plugin, bundle);

    expect((bundle['style.css'] as Rolldown.OutputAsset).source).toBe('.flex > *{flex:1}');
  });
});
