import { exec } from 'node:child_process';

import chalk from 'chalk';
import concurrently from 'concurrently';

/**
 * pnpm run debug
 * --projectPath /Users/taro/testapp
 * --packages @spcsn/taro-shared,@spcsn/taro-runtime
 * --unlink
 *
 * projectPath: 调试的项目
 * packages: 调试的包
 * unlink: 是否进行unlink，默认为link
 */

type DebugArgs = {
  packages?: string;
  projectPath?: string;
  unlink?: boolean;
};

const args = parseArgs(process.argv.slice(2));
const { packages: packagesStr, projectPath, unlink } = args;

const packages = packagesStr?.split(',').filter(Boolean) || [];
const linkType = unlink ? 'unlink' : 'link';

function execCommand(command: string, successMessage: string, errorMessage: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, (error) => {
      if (error) {
        globalThis.console.error(chalk.red(errorMessage), error);
        return reject(error);
      }
      globalThis.console.log(chalk.green(successMessage));
      resolve();
    });
  });
}

function linkToGlobal(): Promise<void[]> {
  return Promise.all(
    packages.map((pkg) =>
      execCommand(
        `pnpm --filter ${pkg} exec yarn ${linkType}`,
        `已在全局将${pkg} ${linkType}`,
        `yarn ${linkType} ${pkg} 出错`,
      ),
    ),
  );
}

function linkToLocal(): Promise<void[]> {
  return Promise.all(
    packages.map((pkg) =>
      execCommand(
        `cd ${projectPath} && yarn ${linkType} ${pkg}`,
        `已在项目中将${pkg} ${linkType}`,
        `yarn ${linkType} ${pkg} 出错`,
      ),
    ),
  );
}

function forceInstall(): Promise<void> {
  globalThis.console.log(chalk.green('正在项目中为您安装unlink的包...'));
  return execCommand(
    `cd ${projectPath} && yarn install --force`,
    `已在项目中为您安装unlink的包`,
    `yarn install --force 出错`,
  );
}

function runDevConcurrently(): Promise<void> | undefined {
  const excludePkg = ['@spcsn/taro'];
  const commands = packages
    .filter((pkg) => !excludePkg.includes(pkg))
    .map((pkg) => {
      const devMap: Record<string, string> = {
        '@spcsn/taro-components': 'dev:components',
      };
      return `pnpm --filter ${pkg} run ${devMap[pkg] || 'dev'}`;
    });

  if (!commands.length) return;

  const { result } = concurrently(commands, {
    prefix: 'name',
    killOthersOn: ['failure', 'success'],
  });

  return result.then(
    () => undefined,
    (error) => {
      globalThis.console.error(chalk.red('自动编译出错:'), error);
      throw error;
    },
  );
}

function parseArgs(rawArgs: string[]): DebugArgs {
  const parsedArgs: DebugArgs = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === '--unlink') {
      parsedArgs.unlink = true;
      continue;
    }

    if (arg === '--projectPath') {
      parsedArgs.projectPath = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--packages') {
      parsedArgs.packages = rawArgs[index + 1];
      index += 1;
    }
  }

  return parsedArgs;
}

async function main(): Promise<void> {
  if (!projectPath || !packages?.length) {
    globalThis.console.error(chalk.red('参数错误~'));
    return;
  }

  try {
    if (unlink) {
      await linkToLocal();
      await linkToGlobal();
      await forceInstall();
    } else {
      await linkToGlobal();
      await linkToLocal();
      await runDevConcurrently();
    }
  } catch (error) {
    globalThis.console.error(chalk.red('工作流执行出错:'), error);
    process.exitCode = 1;
  }
}

main();
