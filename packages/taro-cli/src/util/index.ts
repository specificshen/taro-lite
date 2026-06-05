import { exec } from 'node:child_process';
import * as path from 'node:path';
import * as readline from 'node:readline';

import { chalk, fs } from '@spcsn/taro-helper';

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

export function printNativeMiniDevBanner() {
  if (process.env.NODE_ENV === 'test') return;

  const lines = [
    chalk.cyanBright('╭────────────────────────────────────────────╮'),
    chalk.cyanBright('│') + chalk.magentaBright('   🚀 SPCSN Taro 原生小程序开发引擎启动中   ') + chalk.cyanBright('│'),
    chalk.cyanBright('│') + chalk.greenBright('   React 19  ×  Vite  ×  WeApp  ×  Skyline   ') + chalk.cyanBright('│'),
    chalk.cyanBright('│') + chalk.yellowBright('   正在编译真实微信小程序产物，请保持热爱 ✨   ') + chalk.cyanBright('│'),
    chalk.cyanBright('╰────────────────────────────────────────────╯'),
  ];

  console.log(lines.join('\n'));
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

export function printDevelopmentTip() {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') return;

  console.log(chalk.yellowBright('当前为开发模式，非生产模式。'));
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
