import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { run } from './utils';

const runBuild = run('build', ['commands/build', path.resolve(__dirname, '../dist/platform-weapp')]);

const APP_PATH = path.join(__dirname, 'fixtures/default');
const OUTPUT_PATH = path.join(__dirname, 'fixtures/default/dist');
const KEEP_FILE_PATH = path.join(OUTPUT_PATH, 'project.config.json');
const STALE_FILE_PATH = path.join(OUTPUT_PATH, 'stale-file.txt');

describe('构建配置测试', () => {
  beforeEach(() => {
    fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    fs.writeFileSync(KEEP_FILE_PATH, '{"keep":true}');
    fs.writeFileSync(STALE_FILE_PATH, 'stale');
    process.argv = [];
  });

  afterEach(() => {
    fs.rmSync(STALE_FILE_PATH, { force: true });
    process.argv = [];
  });

  describe('小程序', () => {
    it(`项目 output.clean = clean: { keep: ['project.config.json'] } ==> 清空dist文件夹但保留指定文件`, async () => {
      const exitSpy = vi.spyOn(process, 'exit') as MockInstance<[], never>;
      const logSpy = vi.spyOn(console, 'log');
      logSpy.mockImplementation(() => {});
      exitSpy.mockImplementation(() => {
        throw new Error();
      });

      await runBuild(APP_PATH, {
        options: {
          type: 'weapp',
          platform: 'weapp',
          withoutBuild: true,
        },
      });

      expect(fs.existsSync(KEEP_FILE_PATH)).toBe(true);
      expect(fs.existsSync(STALE_FILE_PATH)).toBe(false);

      exitSpy.mockRestore();
      logSpy.mockRestore();
    });
  });
});
