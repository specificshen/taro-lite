import { afterEach, describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { readConfig } from '../../../src/internal/helper/utils';

let tempDir = '';

function createTempDir() {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taro-read-config-'));
  return tempDir;
}

describe('readConfig', () => {
  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
  });

  it('imports .config.ts via the definePageConfig macro', async () => {
    const dir = createTempDir();
    fs.writeFileSync(
      path.join(dir, 'index.config.ts'),
      `export default definePageConfig({ navigationBarTitleText: 'Hi', disableScroll: true })`,
    );

    expect(await readConfig(path.join(dir, 'index.config.ts'))).toEqual({
      navigationBarTitleText: 'Hi',
      disableScroll: true,
    });
  });

  it('falls back to definePageConfig embedded in the page file when the config file is missing', async () => {
    const dir = createTempDir();
    fs.writeFileSync(
      path.join(dir, 'index.tsx'),
      [
        `export default function Page() { return <div />; }`,
        `definePageConfig({ navigationBarTitleText: 'SFC' as const, enablePullDownRefresh: false })`,
      ].join('\n'),
    );

    expect(await readConfig(path.join(dir, 'index.config'))).toEqual({
      navigationBarTitleText: 'SFC',
      enablePullDownRefresh: false,
    });
  });

  it('returns an empty object when neither config file nor page file exists', async () => {
    const dir = createTempDir();
    expect(await readConfig(path.join(dir, 'index.config'))).toEqual({});
  });
});
