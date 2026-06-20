import * as path from 'node:path';
import type { default as Inquirer, Question } from 'inquirer';
import { chalk, fs } from '../internal/taro-helper';
import { clearConsole, getPkgVersion, getRootPath } from '../util/index';
import { TEMPLATE_CREATOR_FILES } from './constants';
import Creator from './creator';
import { createProject, NpmType, type ProjectConfig, type TemplateHandlers } from './template-creator';

export interface IProjectConf {
  projectName: string;
  projectDir: string;
  npm: NpmType;
  template: string;
  description?: string;
  date?: string;
  src?: string;
  sourceRoot?: string;
  autoInstall?: boolean;
}

type IProjectConfOptions = Partial<IProjectConf>;

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
    const templateAnswer = await this.askTemplate(inquirer);

    return { ...answers, ...templateAnswer };
  }

  async askTemplate(inquirer: typeof Inquirer): Promise<Pick<IProjectConf, 'template'>> {
    if (this.conf.template) return { template: this.conf.template };

    const answer = await inquirer.prompt<IProjectConf>([
      { type: 'list', name: 'template', message: '请选择模板', choices: [{ name: '默认模板', value: 'default' }] },
    ]);

    return { template: answer.template };
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
