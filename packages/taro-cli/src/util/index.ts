import { exec } from 'node:child_process';
import * as path from 'node:path';
import * as readline from 'node:readline';

import { fs } from '@spcsn/taro-helper';

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

function formatDuration(durationMs: number): string {
  return `${durationMs.toFixed(1)}ms`;
}

class CliProfiler {
  private readonly enabled = isProfileEnabled();
  private entries: ProfileEntry[] = [];

  start(): number {
    return this.enabled ? nowMs() : 0;
  }

  end(name: string, startMs: number): void {
    if (!this.enabled) return;

    this.entries.push({
      name,
      durationMs: nowMs() - startMs,
    });
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
    const lines = this.entries.map((entry) => {
      return `  ${entry.name.padEnd(nameWidth)}  ${formatDuration(entry.durationMs)}`;
    });

    console.info(['[taro:profile] cli timings', ...lines].join('\n'));
    this.entries = [];
  }
}

export const cliProfiler = new CliProfiler();

export function getRootPath(): string {
  return path.resolve(__dirname, '../../');
}

export function getPkgVersion(): string {
  return fs.readJSONSync(path.join(getRootPath(), 'package.json')).version;
}

export function getPkgItemByKey(key: string) {
  const packageMap = fs.readJSONSync(path.join(getRootPath(), 'package.json'));
  if (Object.keys(packageMap).indexOf(key) === -1) {
    return {};
  } else {
    return packageMap[key];
  }
}

export function printPkgVersion() {
  const taroVersion = getPkgVersion();
  console.log(`👽 SPCSN Taro v${taroVersion}`);
  console.log();
}
export const getAllFilesInFolder = async (folder: string, filter: string[] = []): Promise<string[]> => {
  let files: string[] = [];
  const list = readDirWithFileTypes(folder);

  await Promise.all(
    list.map(async (item) => {
      const itemPath = path.join(folder, item.name);
      if (item.isDirectory) {
        const _files = await getAllFilesInFolder(itemPath, filter);
        files = [...files, ..._files];
      } else if (item.isFile) {
        if (!filter.find((rule) => rule === item.name)) files.push(itemPath);
      }
    }),
  );

  return files;
};

export type TemplateSourceType = 'git' | 'url';

export function getTemplateSourceType(url: string): TemplateSourceType {
  if (/^github:/.test(url) || /^gitlab:/.test(url) || /^direct:/.test(url)) {
    return 'git';
  } else {
    return 'url';
  }
}

interface FileStat {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}

export function readDirWithFileTypes(folder: string): FileStat[] {
  const list = fs.readdirSync(folder);
  const res = list.map((name) => {
    const stat = fs.statSync(path.join(folder, name));
    return {
      name,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
    };
  });
  return res;
}
export function clearConsole() {
  if (process.stdout.isTTY) {
    const blank = '\n'.repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
  }
}

export function execCommand(params: {
  command: string;
  successCallback?: (data: string) => void;
  failCallback?: (data: string) => void;
}) {
  const { command, successCallback, failCallback } = params;
  const child = exec(command);
  child.stdout!.on('data', function (data) {
    successCallback?.(data);
  });
  child.stderr!.on('data', function (data) {
    failCallback?.(data);
  });
}

export function getPkgNameByFilterVersion(pkgString: string) {
  const versionFlagIndex = pkgString.lastIndexOf('@');
  return versionFlagIndex === 0 ? pkgString : pkgString.slice(0, versionFlagIndex);
}

export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined;
}
