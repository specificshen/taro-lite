import { spawn } from 'node:child_process';
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { chalk } from '../internal/taro-helper';
import { TEMPLATE_CREATOR_FILES } from './constants';

export enum NpmType {
  Yarn = 'Yarn',
  Cnpm = 'Cnpm',
  Pnpm = 'Pnpm',
  Npm = 'Npm',
}

export interface CreateOptions {
  description?: string;
  projectName: string;
  version?: string;
  date?: string;
  template: string;
  typescript: boolean;
  css?: string;
  framework?: string;
}

export interface ProjectConfig {
  projectRoot: string;
  projectName: string;
  npm: NpmType;
  description?: string;
  template: string;
  autoInstall?: boolean;
  templateRoot: string;
  version: string;
  date?: string;
  css?: string;
  framework?: string;
}

type TemplateHandler = (error: Error | null, options: CreateOptions) => boolean | undefined;
export type TemplateHandlers = Record<string, TemplateHandler>;

const FILE_FILTER = new Set([...TEMPLATE_CREATOR_FILES, '.DS_Store', '.npmrc']);
const MEDIA_FILE_PATTERN = /\.(png|jpe?g|gif|svg|webp|jar|keystore|tgz)$/i;
const PACKAGE_MANAGERS: Record<NpmType, string> = {
  [NpmType.Yarn]: 'yarn',
  [NpmType.Cnpm]: 'cnpm',
  [NpmType.Pnpm]: 'pnpm',
  [NpmType.Npm]: 'npm',
};

export async function createProject(conf: ProjectConfig, handlers: TemplateHandlers): Promise<void> {
  const projectPath = path.join(conf.projectRoot, conf.projectName);
  const templatePath = path.join(conf.templateRoot, 'templates', conf.template);
  const templateFiles = await collectTemplateFiles(templatePath);
  const options: CreateOptions = {
    description: conf.description,
    projectName: conf.projectName,
    version: conf.version,
    date: conf.date,
    template: conf.template,
    typescript: true,
    css: conf.css ?? 'None',
    framework: conf.framework ?? 'React',
  };

  console.log();
  console.log(`${chalk.green('✔')} ${chalk.rgb(102, 102, 102)(`创建项目: ${conf.projectName}`)}`);

  for (const templateFile of templateFiles) {
    await createTemplateFile({ templateFile, templatePath, projectPath, options, handlers });
  }

  console.log();
  await initGit(conf.projectName, projectPath);

  if (conf.autoInstall ?? true) {
    await installDeps(conf.npm, projectPath, () => printCreateSuccess(conf.projectName));
    return;
  }

  printCreateSuccess(conf.projectName);
}

async function createTemplateFile(args: {
  templateFile: string;
  templatePath: string;
  projectPath: string;
  options: CreateOptions;
  handlers: TemplateHandlers;
}): Promise<void> {
  const { templateFile, templatePath, projectPath, options, handlers } = args;
  const relativeTemplatePath = normalizePath(templateFile.replace(templatePath, ''));

  if (handlers[relativeTemplatePath]?.(null, { ...options }) === false) return;

  const destinationRelativePath = relativeTemplatePath.replace(/\.tmpl$/, '').replace(/(^|\/)_/, '$1');
  const sourcePath = path.join(templatePath, relativeTemplatePath);
  const destinationPath = path.join(projectPath, destinationRelativePath);

  await writeTemplateFile(sourcePath, destinationPath, options);
  console.log(`${chalk.green('✔')} ${chalk.rgb(102, 102, 102)(`创建文件: ${destinationPath}`)}`);
}

async function writeTemplateFile(sourcePath: string, destinationPath: string, options: CreateOptions): Promise<void> {
  await mkdir(path.dirname(destinationPath), { recursive: true });

  if (MEDIA_FILE_PATTERN.test(sourcePath)) {
    await copyFile(sourcePath, destinationPath);
    return;
  }

  const content = await readFile(sourcePath, 'utf8');
  await writeFile(destinationPath, renderTemplate(content, options));
}

function renderTemplate(content: string, options: CreateOptions): string {
  return content
    .replace(/{{#if typescript }}([\s\S]*?){{\/if}}/g, options.typescript ? '$1' : '')
    .replace(/{{\s*projectName\s*}}/g, options.projectName)
    .replace(/{{\s*description\s*}}/g, options.description ?? '')
    .replace(/{{\s*template\s*}}/g, options.template)
    .replace(/{{\s*version\s*}}/g, options.version ?? '')
    .replace(/{{\s*date\s*}}/g, options.date ?? '')
    .replace(/{{\s*typescript\s*}}/g, String(options.typescript))
    .replace(/{{\s*css\s*}}/g, options.css ?? '')
    .replace(/{{\s*framework\s*}}/g, options.framework ?? '');
}

async function collectTemplateFiles(templatePath: string): Promise<string[]> {
  const entries = await readdir(templatePath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(templatePath, entry.name);
      if (entry.isDirectory()) return collectTemplateFiles(entryPath);
      if (FILE_FILTER.has(entry.name)) return [];
      return [entryPath];
    }),
  );
  return files.flat();
}

async function initGit(projectName: string, projectPath: string): Promise<void> {
  console.log(`cd ${projectName}, 执行 ${chalk.cyan.bold('git init')}`);
  try {
    await executeCommand('git', ['init'], projectPath);
    console.log(`${chalk.green('✔')} ${chalk.green('初始化 git 成功')}`);
  } catch (error) {
    console.log(`${chalk.red('✘')} ${chalk.red('初始化 git 失败')}`);
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('没有找到命令 git, 请检查！');
    }
  }
}

async function installDeps(npm: NpmType, projectPath: string, onSuccess: () => void): Promise<void> {
  const command = PACKAGE_MANAGERS[npm];
  if (!command) return;

  console.log(`执行安装项目依赖 ${chalk.cyan.bold(`${command} install`)}, 需要一会儿...`);
  try {
    await executeCommand(command, ['install'], projectPath);
    console.log(`${chalk.green('✔')} ${chalk.green('安装项目依赖成功')}`);
    onSuccess();
  } catch (error) {
    console.log(`${chalk.red('✘')} ${chalk.red('安装项目依赖失败，请自行重新安装！')}`);
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`没有找到命令 ${command}, 请检查！`);
    }
  }
}

function executeCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, { cwd, stdio: 'inherit' });
    childProcess.on('error', reject);
    childProcess.on('close', (exitCode) => {
      if (exitCode === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} failed with exit code ${exitCode}`));
    });
  });
}

function printCreateSuccess(projectName: string): void {
  console.log(chalk.green(`创建项目 ${chalk.green.bold(projectName)} 成功！`));
  console.log(chalk.green(`请进入项目目录 ${chalk.green.bold(projectName)} 开始工作吧！😝`));
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
}
