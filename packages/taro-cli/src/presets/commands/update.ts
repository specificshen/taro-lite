import * as fs from 'node:fs';
import * as path from 'node:path';
import { exec } from 'node:child_process';

import * as inquirer from 'inquirer';
import getLatestVersion from 'latest-version';
import ora from 'ora';
import * as semver from 'semver';

import type { IPluginContext } from '@spcsn/taro-service';

const packagesManagement = {
  yarn: {
    command: 'yarn install',
    globalCommand: 'yarn global add @spcsn/taro-cli',
  },
  pnpm: {
    command: 'pnpm install',
    globalCommand: 'pnpm add -g @spcsn/taro-cli',
  },
  cnpm: {
    command: 'cnpm install',
    globalCommand: 'cnpm i -g @spcsn/taro-cli',
  },
  npm: {
    command: 'npm install',
    globalCommand: 'npm i -g @spcsn/taro-cli',
  },
} as const;

function getPkgItemByKey(key: string) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageMap = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (Object.keys(packageMap).indexOf(key) === -1) {
    return {};
  }
  return packageMap[key];
}

function execCommand(params: {
  command: string;
  successCallback?: (data: string) => void;
  failCallback?: (data: string) => void;
}) {
  const { command, successCallback, failCallback } = params;
  const testExec = (globalThis as typeof globalThis & { __TARO_CLI_TEST_EXEC__?: typeof exec }).__TARO_CLI_TEST_EXEC__;
  const child = (testExec || exec)(command);
  child.stdout!.on('data', function (data) {
    successCallback?.(data);
  });
  child.stderr!.on('data', function (data) {
    failCallback?.(data);
  });
}

export default (ctx: IPluginContext) => {
  ctx.registerCommand({
    name: 'update',
    synopsisList: ['taro update self [version]', 'taro update project [version]'],
    optionsMap: {
      '--npm [npm]': '包管理工具',
      '-h, --help': 'output usage information',
    },
    async fn({ _, options }) {
      const { npm } = options;
      const [, updateType, version] = _ as [string, ('self' | 'project')?, string?];
      const { appPath, configPath } = ctx.paths;
      const { chalk, fs, PROJECT_CONFIG, UPDATE_PACKAGE_LIST } = ctx.helper;

      const pkgPath = path.join(appPath, 'package.json');
      const pkgName = getPkgItemByKey('name');
      const conf = {
        npm: null,
      };
      const prompts: Record<string, unknown>[] = [];

      async function getTargetVersion() {
        let targetTaroVersion;
        const testLatestVersion = (globalThis as typeof globalThis & { __TARO_CLI_TEST_LATEST_VERSION__?: string })
          .__TARO_CLI_TEST_LATEST_VERSION__;

        if (version) {
          targetTaroVersion = semver.clean(version);
        } else if (testLatestVersion) {
          targetTaroVersion = testLatestVersion;
        } else {
          try {
            targetTaroVersion = await getLatestVersion(pkgName, {
              version: 'latest',
            });
          } catch (e) {
            targetTaroVersion = await getLatestVersion(pkgName);
          }
        }
        if (!semver.valid(targetTaroVersion)) {
          console.log(chalk.red('命令错误:无效的 version ~'));
          throw Error('无效的 version!');
        }
        return targetTaroVersion;
      }

      function execUpdate(command: string, version: string, isSelf = false) {
        const updateTarget = isSelf ? ' CLI ' : ' Taro 项目依赖';
        const spinString = `正在更新${updateTarget}到 v${version} ...`;
        const spinner = ora(spinString).start();
        execCommand({
          command,
          successCallback(data) {
            spinner.stop();
            console.log(data.replace(/\n$/, ''));
          },
          failCallback(data) {
            spinner.stop();
            spinner.warn(data.replace(/\n$/, ''));
          },
        });
      }

      /** 更新全局的 Taro CLI */
      async function updateSelf() {
        const spinner = ora('正在获取最新版本信息...').start();
        const targetTaroVersion = await getTargetVersion();
        spinner.stop();
        console.log(chalk.green(`Taro 最新版本：${targetTaroVersion}\n`));

        askNpm(conf, prompts);
        const answers = npm ? { npm } : await inquirer.prompt(prompts);

        const command = `${packagesManagement[answers.npm].globalCommand}@${targetTaroVersion}`;
        execUpdate(command, targetTaroVersion, true);
      }

      /** 更新当前项目中的 Taro 相关依赖 */
      async function updateProject() {
        if (!configPath || !fs.existsSync(configPath)) {
          console.log(chalk.red(`找不到项目配置文件 ${PROJECT_CONFIG}，请确定当前目录是 Taro 项目根目录!`));
          process.exit(1);
        }
        const packageMap = fs.readJSONSync(pkgPath);

        const spinner = ora('正在获取最新版本信息...').start();

        const version = await getTargetVersion();

        spinner.stop();

        const oldVersion = packageMap.dependencies['@spcsn/taro'];
        // 更新 @spcsn/* 底座版本
        Object.keys(packageMap.dependencies || {}).forEach((key) => {
          if (UPDATE_PACKAGE_LIST.indexOf(key) !== -1) {
            packageMap.dependencies[key] = version;
          }
        });
        Object.keys(packageMap.devDependencies || {}).forEach((key) => {
          if (UPDATE_PACKAGE_LIST.indexOf(key) !== -1) {
            packageMap.devDependencies[key] = version;
          }
        });

        // 写入package.json
        try {
          const testWriteJson = (
            globalThis as typeof globalThis & { __TARO_CLI_TEST_WRITE_JSON__?: typeof fs.writeJson }
          ).__TARO_CLI_TEST_WRITE_JSON__;
          await (testWriteJson || fs.writeJson)(pkgPath, packageMap, { spaces: '\t' });
          console.log(
            chalk.green(`项目当前 Taro 版本：${oldVersion}，Taro 最新版本：${version}，更新项目 package.json 成功！`),
          );
          console.log();
        } catch (err) {
          console.error(err);
        }

        askNpm(conf, prompts);
        const answers = npm ? { npm } : await inquirer.prompt(prompts);

        const command = packagesManagement[answers.npm].command;

        execUpdate(command, version);
      }

      function askNpm(conf, prompts) {
        const packages = [
          {
            name: 'yarn',
            value: 'yarn',
          },
          {
            name: 'pnpm',
            value: 'pnpm',
          },
          {
            name: 'npm',
            value: 'npm',
          },
          {
            name: 'cnpm',
            value: 'cnpm',
          },
        ];

        if ((typeof conf.npm as string | undefined) !== 'string') {
          prompts.push({
            type: 'list',
            name: 'npm',
            message: '请选择包管理工具',
            choices: packages,
          });
        }
      }

      if (updateType === 'self') return updateSelf();

      if (updateType === 'project') return updateProject();

      console.log(chalk.red('命令错误:'));
      console.log(
        `${chalk.green('taro update self [version]')} 更新 Taro 开发工具 taro-cli 到指定版本或 Taro3 的最新版本`,
      );
      console.log(
        `${chalk.green('taro update project [version]')} 更新项目所有 Taro 相关依赖到指定版本或 Taro3 的最新版本`,
      );
    },
  });
};
