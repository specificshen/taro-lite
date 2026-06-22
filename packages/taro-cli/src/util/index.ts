import * as path from 'node:path';
import * as readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { fs } from '../internal/taro-helper';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import type { FileStat } from './types';

type ProfileEntry = {
  name: string;
  durationMs: number;
};

function isProfileEnabled(): boolean {
  const rawValue = process.env.TARO_PROFILE;
  if (!rawValue) return false;
  return !['0', 'false', 'off', 'no'].includes(rawValue.toLowerCase());
}

function nowMs(): number {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

class CliProfiler {
  private readonly enabled = isProfileEnabled();
  private entries: ProfileEntry[] = [];

  start(): number {
    return this.enabled ? nowMs() : 0;
  }

  end(name: string, startMs: number): void {
    if (!this.enabled) return;
    this.entries.push({ name, durationMs: nowMs() - startMs });
  }

  async measure<T>(name: string, task: () => Promise<T>): Promise<T> {
    const startMs = this.start();
    try {
      return await task();
    } finally {
      this.end(name, startMs);
    }
  }

  print(): void {
    if (!this.enabled || this.entries.length === 0) return;

    const nameWidth = Math.max(...this.entries.map((entry) => entry.name.length));
    const lines = this.entries.map((entry) => `  ${entry.name.padEnd(nameWidth)}  ${entry.durationMs.toFixed(1)}ms`);
    console.info(['[taro:profile] cli timings', ...lines].join('\n'));
    this.entries = [];
  }
}

export const cliProfiler = new CliProfiler();

export function getRootPath(): string {
  return path.resolve(__dirname, '../../');
}

export function getPkgVersion(): string {
  return (fs.readJSONSync(path.join(getRootPath(), 'package.json')) as { version: string }).version;
}

export function printPkgVersion(): void {
  console.log(`👽 SPCSN Taro v${getPkgVersion()}`);
  console.log();
}

export function readDirWithFileTypes(folder: string): FileStat[] {
  return fs.readdirSync(folder).map((name: string) => {
    const stat = fs.statSync(path.join(folder, name));
    return { name, isDirectory: stat.isDirectory(), isFile: stat.isFile() };
  });
}

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function clearConsole(): void {
  if (process.stdout.isTTY) {
    const blank = '\n'.repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
  }
}
