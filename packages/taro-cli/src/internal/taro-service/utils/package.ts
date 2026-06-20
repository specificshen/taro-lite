import * as fs from 'node:fs';
import * as path from 'node:path';

export function getRootPath(): string {
  return path.resolve(__dirname, '../../../..');
}

export function getPkgVersion(): string {
  const packageJsonPath = path.join(getRootPath(), 'package.json');
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  return JSON.parse(packageJsonContent).version;
}

export function printPkgVersion() {
  process.stdout.write(`👽 SPCSN Taro v${getPkgVersion()}\n\n`);
}
