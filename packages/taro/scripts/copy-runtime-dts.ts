import { spawnSync } from 'node:child_process';
import * as path from 'node:path';

const configPath = path.resolve(__dirname, '../tsconfig.runtime-dts.json');
const result = spawnSync('tsc', ['--project', configPath], {
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('Generated runtime .d.ts files in dist/runtime');
