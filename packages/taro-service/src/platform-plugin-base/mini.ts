import { recursiveMerge, taroJsMiniComponentsPath } from '@spcsn/taro-helper';
import { isObject, PLATFORM_TYPE } from '@spcsn/taro-shared';

import { getPkgVersion } from '../utils/package';
import { serviceProfiler } from '../utils/profile';
import TaroPlatform from './platform';

import type { RecursiveTemplate, UnRecursiveTemplate } from '@spcsn/taro-shared/dist/template';
import type { TConfig } from '../utils/types';

interface IFileType {
  templ: string;
  style: string;
  config: string;
  script: string;
  xs?: string;
}

export abstract class TaroPlatformBase<T extends TConfig = TConfig> extends TaroPlatform<T> {
  platformType = PLATFORM_TYPE.MINI;

  abstract globalObject: string;
  abstract fileType: IFileType;
  abstract template: RecursiveTemplate | UnRecursiveTemplate;
  // Note: 给所有的小程序平台一个默认的 taroComponentsPath
  taroComponentsPath: string = taroJsMiniComponentsPath;
  projectConfigJson?: string;

  /**
   * 1. 清空 dist 文件夹
   * 2. 输出编译提示
   * 3. 生成 project.config.json
   */
  private async setup() {
    await serviceProfiler.measure('platform setup', () => this.setupTransaction.perform(this.setupImpl, this));
    this.ctx.onSetupClose?.(this);
  }

  private setupImpl() {
    const { output } = this.config;
    // 仅 output.clean 为 false 时不清空输出目录
    if (output === undefined || output === null || output.clean === undefined || output.clean === null || output.clean === true) {
      this.emptyOutputDir();
    } else if (isObject(output.clean)) {
      this.emptyOutputDir(output.clean.keep || []);
    }
    this.printBuildSummary();
    if (this.projectConfigJson) {
      this.generateProjectConfig(this.projectConfigJson);
    }
  }

  protected printBuildSummary() {
    if (process.env.NODE_ENV === 'test') return;

    const { chalk } = this.helper;
    const isProduction = process.env.NODE_ENV === 'production';
    const modeLabel = isProduction ? '生产模式' : '开发模式';
    const modeHint = isProduction ? '准备见用户，保持体面' : '正在热身，改完就看';
    const watchLabel = this.ctx.runOpts?.isWatch ? '监听变更' : '单次构建';
    const watchHint = this.ctx.runOpts?.isWatch ? '我盯着文件，你放心写' : '一锤定音，构建完就收工';
    const minifyLabel = process.env.TARO_MINIFY === 'true' || isProduction ? '开启' : '关闭';
    const humorLine = isProduction ? '✨ 今天的产物会比较克制，适合上线见人。' : '☕ 别慌，代码正在穿微信小程序外套。';
    const contentWidth = 54;
    const line = (content: string, color: (value: string) => string) => {
      return chalk.cyanBright('│') + color(this.padEndByDisplayWidth(content, contentWidth)) + chalk.cyanBright('│');
    };

    const lines = [
      chalk.cyanBright(`╭${'─'.repeat(contentWidth)}╮`),
      line('  🚀 SPCSN Taro 小程序构建站已开张', chalk.magentaBright),
      line('', chalk.gray),
      line(`  模式  ${modeLabel}  ·  ${modeHint}`, chalk.greenBright),
      line(`  目标  ${this.platform}  ·  React 19 × Vite × Skyline`, chalk.blueBright),
      line(`  压缩  ${minifyLabel}  ·  输出微信小程序产物`, chalk.yellowBright),
      line(`  节奏  ${watchLabel}  ·  ${watchHint}`, chalk.cyanBright),
      line('', chalk.gray),
      line(`  ${humorLine}`, chalk.whiteBright),
      chalk.cyanBright(`╰${'─'.repeat(contentWidth)}╯`),
    ];

    console.log(lines.join('\n'));
    console.log();
  }

  private padEndByDisplayWidth(content: string, targetWidth: number) {
    const contentWidth = this.getTerminalDisplayWidth(content);
    return content + ' '.repeat(Math.max(targetWidth - contentWidth, 0));
  }

  private getTerminalDisplayWidth(content: string) {
    return Array.from(content).reduce((width, character) => {
      const codePoint = character.codePointAt(0);
      if (!codePoint || this.isZeroWidthCodePoint(codePoint)) return width;
      return width + (this.isFullWidthCodePoint(codePoint) ? 2 : 1);
    }, 0);
  }

  private isZeroWidthCodePoint(codePoint: number) {
    return (
      codePoint === 0x200d ||
      (codePoint >= 0x0300 && codePoint <= 0x036f) ||
      (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
    );
  }

  private isFullWidthCodePoint(codePoint: number) {
    return (
      codePoint >= 0x1100 &&
      (codePoint <= 0x115f ||
        codePoint === 0x2329 ||
        codePoint === 0x232a ||
        (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
        (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
        (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
        (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
        (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
        (codePoint >= 0xff00 && codePoint <= 0xff60) ||
        (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
        (codePoint >= 0x1f300 && codePoint <= 0x1faff))
    );
  }

  /**
   * 返回当前项目内的 runner 包
   */
  protected async getRunner() {
    const { appPath } = this.ctx.paths;
    const { npm } = this.helper;

    const runnerPkg = '@spcsn/taro-vite-runner';

    const runner = await serviceProfiler.measure('load runner module', () => npm.getNpmPkg(runnerPkg, appPath));

    return runner.bind(null, appPath);
  }

  /**
   * 准备 runner 参数
   * @param extraOptions 需要额外合入 Options 的配置项
   */
  protected getOptions(extraOptions = {}) {
    const { ctx, globalObject, fileType, template } = this;

    const config = recursiveMerge(Object.assign({}, this.config), {
      env: {
        FRAMEWORK: JSON.stringify(this.config.framework),
        TARO_ENV: JSON.stringify(this.platform),
        TARO_PLATFORM: JSON.stringify(this.platformType),
        TARO_VERSION: JSON.stringify(getPkgVersion()),
      },
    });

    return {
      ...config,
      nodeModulesPath: ctx.paths.nodeModulesPath,
      buildAdapter: config.platform,
      platformType: this.platformType,
      globalObject,
      fileType,
      template,
      ...extraOptions,
    };
  }

  /**
   * 调用 runner 开始编译
   * @param extraOptions 需要额外传入 runner 的配置项
   */
  private async build(extraOptions = {}) {
    if (this.config.withoutBuild) return;

    this.ctx.onBuildInit?.(this);
    await this.buildTransaction.perform(this.buildImpl, this, extraOptions);
  }

  private async buildImpl(extraOptions = {}) {
    const runner = await serviceProfiler.measure('prepare runner', () => this.getRunner());
    const getOptionsStartMs = serviceProfiler.start();
    const options = this.getOptions(
      Object.assign(
        {
          runtimePath: this.runtimePath,
          taroComponentsPath: this.taroComponentsPath,
          behaviorsName: this.behaviorsName,
        },
        extraOptions,
      ),
    );
    serviceProfiler.end('prepare runner options', getOptionsStartMs);
    await serviceProfiler.measure('run runner', () => runner(options));
  }

  /**
   * 生成 project.config.json
   * @param src 项目源码中配置文件的名称
   * @param dist 编译后配置文件的名称，默认为 'project.config.json'
   */
  protected generateProjectConfig(src: string, dist = 'project.config.json') {
    if (this.config.isBuildNativeComp) return;
    this.ctx.generateProjectConfig({
      srcConfigName: src,
      distConfigName: dist,
    });
  }

  /**
   * 递归替换对象的 key 值
   */
  protected recursiveReplaceObjectKeys(obj, keyMap) {
    Object.keys(obj).forEach((key) => {
      if (keyMap[key]) {
        obj[keyMap[key]] = obj[key];
        if (typeof obj[key] === 'object') {
          this.recursiveReplaceObjectKeys(obj[keyMap[key]], keyMap);
        }
        delete obj[key];
      } else if (keyMap[key] === false) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        this.recursiveReplaceObjectKeys(obj[key], keyMap);
      }
    });
  }

  /**
   * 调用 runner 开启编译
   */
  public async start() {
    await this.setup();
    await serviceProfiler.measure('platform build', () => this.build());
  }
}
