import { describe, expect, it, vi } from 'vitest';
import type { FrameworkPluginContext } from '../../src/react-framework';
import reactFrameworkPlugin from '../../src/react-framework';

describe('react framework plugin defaults', () => {
  it('injects vite compiler when runner options omit compiler', () => {
    const ctx: FrameworkPluginContext = {
      initialConfig: {
        framework: 'react',
      },
      modifyRunnerOpts: vi.fn((modifier) => {
        const payload = { opts: {} };
        modifier(payload);
        expect(payload.opts).toHaveProperty('compiler');
        expect(payload.opts.compiler).toMatchObject({ type: 'vite' });
      }),
      runnerUtils: {
        getViteMiniCompilerContext: () => undefined,
      },
    };

    reactFrameworkPlugin(ctx);

    expect(ctx.modifyRunnerOpts).toHaveBeenCalledTimes(1);
  });
});
