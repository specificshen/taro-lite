import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IPluginContext } from '../../../src/internal/taro-service';
import initCommand from '../../../src/presets/commands/init';

const createMock = vi.fn();

class MockProject {
  public conf: Record<string, unknown>;
  constructor(options: Record<string, unknown>) {
    this.conf = options;
  }
  async create() {
    createMock(this.conf);
  }
}

vi.mock('../../../src/create/project.js', () => ({
  default: MockProject,
}));

describe('init command', () => {
  let ctx: IPluginContext;
  let registered: Record<string, { fn: (opts: Record<string, unknown>) => Promise<void> }>;
  const appPath = '/tmp/taro-init';

  beforeEach(() => {
    registered = {};
    createMock.mockClear();
    ctx = {
      paths: { appPath },
      registerCommand: vi.fn((cmd) => {
        registered[cmd.name] = cmd;
      }),
    } as unknown as IPluginContext;
  });

  it('should pass options to Project.create', async () => {
    initCommand(ctx);
    await registered.init.fn({
      _: ['init', 'demo'],
      options: {
        projectName: 'demo',
        template: 'default',
        description: 'Demo project',
        npm: 'pnpm',
        autoInstall: false,
      },
      isHelp: false,
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const conf = createMock.mock.calls[0][0] as Record<string, unknown>;
    expect(conf.projectDir).toBe(appPath);
    expect(conf.projectName).toBe('demo');
    expect(conf.template).toBe('default');
    expect(conf.description).toBe('Demo project');
    expect(conf.npm).toBe('pnpm');
    expect(conf.autoInstall).toBe(false);
  });
});
