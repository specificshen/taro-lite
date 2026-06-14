import * as path from 'node:path';
import {
  chalk,
  DEFAULT_TEMPLATE_SRC,
  DEFAULT_TEMPLATE_SRC_GITEE,
  fs,
  getUserHomeDir,
  TARO_BASE_CONFIG,
  TARO_CONFIG_FOLDER,
} from '@spcsn/taro-helper';
import type { default as Inquirer, Question } from 'inquirer';
import { clearConsole, getPkgVersion, getRootPath } from '../util/index';
import { TEMPLATE_CREATOR_FILES } from './constants';
import Creator from './creator';
import fetchTemplate from './fetch-template';
import { createProject, NpmType, type ProjectConfig, type TemplateHandlers } from './template-creator';
import type { ITemplates } from './fetch-template';

export interface IProjectConf {
  projectName: string;
  projectDir: string;
  npm: NpmType;
  templateSource: string;
  clone?: boolean;
  template: string;
  description?: string;
  date?: string;
  src?: string;
  sourceRoot?: string;
  autoInstall?: boolean;
}

type IProjectConfOptions = Partial<IProjectConf>;

const NONE_AVAILABLE_TEMPLATE = '无可用模板';

export default class Project extends Creator {
  public rootPath: string;
  public conf: IProjectConfOptions;

  constructor(options: IProjectConfOptions) {
    super(options.sourceRoot);
    this.rootPath = this._rootPath;
    this.conf = {
      projectName: '',
      projectDir: '',
      template: '',
      description: '',
      npm: NpmType.Pnpm,
      ...options,
    };
  }

  init(): void {
    clearConsole();
    console.log(chalk.green('Taro Core 即将创建一个新项目!'));
    console.log(`Need help? Go and open issue: ${chalk.blueBright('https://tls.jd.com/taro-issue-helper')}`);
    console.log();
  }

  async create(): Promise<void> {
    try {
      const answers = await this.ask();
      const date = new Date();
      this.conf = { ...this.conf, ...answers, date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` };
      await this.write();
    } catch (error) {
      console.log(chalk.red('创建项目失败: ', error));
    }
  }

  async ask(): Promise<IProjectConfOptions> {
    const { default: inquirer } = (await import('inquirer')) as { default: typeof Inquirer };
    const prompts: Question<IProjectConf>[] = [];

    if (typeof this.conf.projectName !== 'string') {
      prompts.push({
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称！',
        validate(input) {
          if (!input) return '项目名不能为空！';
          if (fs.existsSync(input)) return '当前目录已经存在同名项目，请换一个项目名！';
          return true;
        },
      });
    }

    if (typeof this.conf.description !== 'string') {
      prompts.push({
        type: 'input',
        name: 'description',
        message: '请输入项目介绍',
      });
    }

    if (typeof this.conf.npm !== 'string') {
      prompts.push({
        type: 'list',
        name: 'npm',
        message: '请选择包管理工具',
        choices: [
          { name: 'pnpm', value: NpmType.Pnpm },
          { name: 'yarn', value: NpmType.Yarn },
          { name: 'npm', value: NpmType.Npm },
        ],
        default: NpmType.Pnpm,
      });
    }

    const answers = await inquirer.prompt<IProjectConf>(prompts);
    const sourceAnswer = await this.askTemplateSource(inquirer);
    const templates = await this.fetchTemplates(sourceAnswer.templateSource);
    const templateAnswer = await this.askTemplate(inquirer, templates);

    return { ...answers, ...sourceAnswer, ...templateAnswer };
  }

  async askTemplateSource(inquirer: typeof Inquirer): Promise<Pick<IProjectConf, 'templateSource'>> {
    if (this.conf.templateSource) return { templateSource: this.conf.templateSource };

    const homedir = getUserHomeDir();
    const taroConfigPath = path.join(homedir, TARO_CONFIG_FOLDER);
    const taroConfig = path.join(taroConfigPath, TARO_BASE_CONFIG);
    let localTemplateSource: string | undefined;

    if (fs.existsSync(taroConfig)) {
      localTemplateSource = (await fs.readJSON(taroConfig))?.templateSource;
    } else {
      await fs.createFile(taroConfig);
      await fs.writeJSON(taroConfig, { templateSource: DEFAULT_TEMPLATE_SRC });
      localTemplateSource = DEFAULT_TEMPLATE_SRC;
    }

    const choices = [
      { name: 'Gitee（最快）', value: DEFAULT_TEMPLATE_SRC_GITEE },
      { name: 'Github（最新）', value: DEFAULT_TEMPLATE_SRC },
      { name: 'CLI 内置默认模板', value: 'default-template' },
      { name: '自定义', value: 'self-input' },
    ];

    if (
      localTemplateSource &&
      localTemplateSource !== DEFAULT_TEMPLATE_SRC &&
      localTemplateSource !== DEFAULT_TEMPLATE_SRC_GITEE
    ) {
      choices.unshift({ name: `本地模板源：${localTemplateSource}`, value: localTemplateSource });
    }

    const answer = await inquirer.prompt<IProjectConf>([
      { type: 'list', name: 'templateSource', message: '请选择模板源', choices },
      {
        type: 'input',
        name: 'templateSource',
        message: '请输入模板源！',
        askAnswered: true,
        when: (a) => a.templateSource === 'self-input',
      },
    ]);

    return { templateSource: answer.templateSource };
  }

  async askTemplate(inquirer: typeof Inquirer, templates: ITemplates[]): Promise<Pick<IProjectConf, 'template'>> {
    if (this.conf.template) return { template: this.conf.template };

    const choices = [
      { name: '默认模板', value: 'default' },
      ...templates.map((item) => ({
        name: item.desc ? `${item.name}（${item.desc}）` : item.name,
        value: item.value || item.name,
      })),
    ];

    const answer = await inquirer.prompt<IProjectConf>([
      { type: 'list', name: 'template', message: '请选择模板', choices },
    ]);

    return { template: answer.template };
  }

  async fetchTemplates(templateSource?: string): Promise<ITemplates[]> {
    if (!templateSource || templateSource === NONE_AVAILABLE_TEMPLATE) return [];
    if (templateSource === 'default-template') {
      this.conf.template = 'default';
      return [];
    }

    const isClone = /gitee/.test(templateSource) || this.conf.clone;
    const choices = await fetchTemplate(templateSource, this.templatePath(''), isClone);
    return choices.filter((choice) => {
      const platforms = choice.platforms;
      if (typeof platforms === 'string') return platforms.toLowerCase() === 'react';
      if (Array.isArray(platforms)) return platforms.map((p) => p.toLowerCase()).includes('react');
      return true;
    });
  }

  async write(): Promise<void> {
    const { projectName, projectDir, template, autoInstall = true, npm } = this.conf as IProjectConf;
    const templatePath = this.templatePath(template);
    const handlerPath = TEMPLATE_CREATOR_FILES.map((fileName) => path.join(templatePath, fileName)).find((filePath) =>
      fs.existsSync(filePath),
    );
    const handler = handlerPath ? ((await import(handlerPath)) as { handler: TemplateHandlers }).handler : {};

    await createProject(
      {
        projectRoot: projectDir,
        projectName,
        template,
        npm,
        autoInstall,
        templateRoot: getRootPath(),
        version: getPkgVersion(),
        description: this.conf.description,
        date: this.conf.date,
      } satisfies ProjectConfig,
      handler,
    );
  }
}
