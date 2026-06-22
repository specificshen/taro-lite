import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as helper from '../../../src/internal/taro-helper';
import type { IPluginContext } from '../../../src/internal/taro-service';
import writeFileToDistPreset from '../../../src/presets/files/write-file-to-dist';

describe('writeFileToDist preset', () => {
  let outputPath: string;
  let ctx: IPluginContext;
  let registered: Record<string, (args: { filePath: string; content: string }) => void>;

  beforeEach(() => {
    outputPath = fs.mkdtempSync(path.join(os.tmpdir(), 'taro-write-file-'));
    registered = {};
    ctx = {
      paths: { outputPath },
      helper: {
        fs: helper.fs,
        printLog: vi.fn(),
        processTypeEnum: helper.processTypeEnum,
      },
      registerMethod: vi.fn((name: string, fn) => {
        registered[name] = fn;
      }),
    } as unknown as IPluginContext;
  });

  afterEach(() => {
    fs.rmSync(outputPath, { recursive: true, force: true });
  });

  it('should write relative file to output path', () => {
    writeFileToDistPreset(ctx);
    registered.writeFileToDist({ filePath: 'foo/bar.json', content: '{"a":1}' });

    const target = path.join(outputPath, 'foo/bar.json');
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readFileSync(target, 'utf8')).toBe('{"a":1}');
  });

  it('should reject absolute file path', () => {
    const printLog = ctx.helper.printLog as ReturnType<typeof vi.fn>;
    const absolutePath = path.join(os.tmpdir(), 'taro-absolute-reject.txt');
    writeFileToDistPreset(ctx);
    registered.writeFileToDist({ filePath: absolutePath, content: 'x' });

    expect(fs.existsSync(absolutePath)).toBe(false);
    expect(printLog).toHaveBeenCalledWith(helper.processTypeEnum.ERROR, 'ctx.writeFileToDist 不能接受绝对路径');
  });
});
