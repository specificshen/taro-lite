import { spawn } from 'node:child_process';
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { chalk } from '@spcsn/taro-helper';

export enum CompilerType {
  Webpack4 = 'Webpack4',
  Webpack5 = 'Webpack5',
  Vite = 'Vite',
}

export enum CSSType {
  None = 'None',
  Sass = 'Sass',
  Stylus = 'Stylus',
  Less = 'Less',
}

export enum FrameworkType {
  React = 'React',
  Preact = 'Preact',
  Vue3 = 'Vue3',
  Solid = 'Solid',
  None = 'None',
}

export enum NpmType {
  Yarn = 'Yarn',
  Cnpm = 'Cnpm',
  Pnpm = 'Pnpm',
  Npm = 'Npm',
}

export enum PeriodType {
  CreateAPP = 'CreateAPP',
  CreatePage = 'CreatePage',
}

export interface CreateOptions {
  css?: CSSType;
  cssExt?: string;
  framework?: FrameworkType;
  description?: string;
  projectName: string;
  version?: string;
  date?: string;
  typescript?: boolean;
  buildEs5?: boolean;
  template: string;
  pageName?: string;
  compiler?: CompilerType;
  setPageName?: string;
  subPkg?: string;
  pageDir?: string;
  setSubPkgPageName?: string;
  changeExt?: boolean;
  isCustomTemplate?: boolean;
  pluginType?: string;
}

export interface ProjectConfig {
  projectRoot: string;
  projectName: string;
  npm: NpmType;
  description?: string;
  typescript?: boolean;
  buildEs5?: boolean;
  template: string;
  css: CSSType;
  autoInstall?: boolean;
  framework: FrameworkType;
  templateRoot: string;
  version: string;
  date?: string;
  compiler?: CompilerType;
  period: PeriodType;
}

type TemplateHandlerResult = boolean | { setPageName?: string; setSubPkgName?: string; changeExt?: boolean };
type TemplateHandler = (error: Error | null, options: CreateOptions) => TemplateHandlerResult;
type TemplateHandlers = Record<string, TemplateHandler>;

const TEMPLATE_CREATOR = 'template_creator.js';
const FILE_FILTER = new Set([TEMPLATE_CREATOR, '.DS_Store', '.npmrc']);
const MEDIA_FILE_PATTERN = /\.(png|jpe?g|gif|svg|webp|jar|keystore|tgz)$/i;
const STYLE_EXTENSIONS: Record<CSSType, string> = {
  [CSSType.None]: 'css',
  [CSSType.Sass]: 'scss',
  [CSSType.Stylus]: 'styl',
  [CSSType.Less]: 'less',
};
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
  const createOptions: CreateOptions = {
    css: conf.css,
    cssExt: STYLE_EXTENSIONS[conf.css],
    framework: conf.framework,
    description: conf.description,
    projectName: conf.projectName,
    version: conf.version,
    date: conf.date,
    typescript: conf.typescript,
    buildEs5: conf.buildEs5,
    template: conf.template,
    pageName: 'index',
    compiler: conf.compiler,
  };

  console.log();
  console.log(`${chalk.green('✔')} ${chalk.rgb(102, 102, 102)(`创建项目: ${conf.projectName}`)}`);

  for (const templateFile of templateFiles) {
    await createTemplateFile({ templateFile, templatePath, projectPath, options: createOptions, handlers });
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
  if (shouldSkipByFramework(relativeTemplatePath, options.framework)) return;

  const handlerResult = handlers[relativeTemplatePath]?.(null, { ...options });
  if (handlerResult === false) return;

  const destinationRelativePath = resolveDestinationRelativePath(relativeTemplatePath, handlerResult, options);
  const sourcePath = path.join(templatePath, relativeTemplatePath);
  const destinationPath = normalizeTemplateDestination(path.join(projectPath, destinationRelativePath));

  await writeTemplateFile(sourcePath, destinationPath, options);
  console.log(`${chalk.green('✔')} ${chalk.rgb(102, 102, 102)(`创建文件: ${destinationPath}`)}`);
}

function shouldSkipByFramework(relativeTemplatePath: string, framework?: FrameworkType): boolean {
  const isVueFramework = framework === FrameworkType.Vue3;
  if (isVueFramework && relativeTemplatePath.endsWith('.jsx')) return true;
  return !isVueFramework && relativeTemplatePath.endsWith('.vue');
}

function resolveDestinationRelativePath(
  relativeTemplatePath: string,
  handlerResult: TemplateHandlerResult | undefined,
  options: CreateOptions,
): string {
  const handlerDestination = typeof handlerResult === 'object' ? handlerResult : undefined;
  let destinationRelativePath = handlerDestination?.setPageName ?? relativeTemplatePath;

  if (options.subPkg && handlerDestination?.setSubPkgName) {
    destinationRelativePath = handlerDestination.setSubPkgName;
  }

  if (destinationRelativePath.startsWith('/')) {
    destinationRelativePath = destinationRelativePath.slice(1);
  }

  const shouldChangeExt = handlerDestination?.changeExt ?? true;
  if (options.typescript && shouldChangeExt && shouldConvertScriptExtension(destinationRelativePath)) {
    destinationRelativePath = destinationRelativePath.replace(/\.jsx?$/, (extension) =>
      extension === '.jsx' ? '.tsx' : '.ts',
    );
  }

  if (shouldChangeExt && destinationRelativePath.endsWith('.css')) {
    destinationRelativePath = destinationRelativePath.replace(/\.css$/, `.${options.cssExt ?? 'css'}`);
  }

  return destinationRelativePath;
}

function shouldConvertScriptExtension(filePath: string): boolean {
  if (!(filePath.endsWith('.js') || filePath.endsWith('.jsx'))) return false;
  return !(filePath.endsWith('babel.config.js') || filePath.endsWith('.eslintrc.js'));
}

async function writeTemplateFile(sourcePath: string, destinationPath: string, options: CreateOptions): Promise<void> {
  await mkdir(path.dirname(destinationPath), { recursive: true });

  if (MEDIA_FILE_PATTERN.test(sourcePath)) {
    await copyFile(sourcePath, destinationPath);
    return;
  }

  const templateContent = await readFile(sourcePath, 'utf8');
  const renderedContent = renderTemplate(templateContent, options);
  await writeFile(destinationPath, renderedContent);
}

function renderTemplate(templateContent: string, options: CreateOptions): string {
  return templateContent
    .replace(/{{#if \(eq css "Sass"\) }}([\s\S]*?){{\/if}}/g, options.css === CSSType.Sass ? '$1' : '')
    .replace(/{{#if \(eq css "Less"\) }}([\s\S]*?){{\/if}}/g, options.css === CSSType.Less ? '$1' : '')
    .replace(/{{#if \(eq css "Stylus"\) }}([\s\S]*?){{\/if}}/g, options.css === CSSType.Stylus ? '$1' : '')
    .replace(/{{#if typescript }}([\s\S]*?){{\/if}}/g, options.typescript ? '$1' : '')
    .replace(/{{\s*to_pascal_case\s+pageName\s*}}/g, toPascalCase(options.pageName ?? 'index'))
    .replace(/{{\s*projectName\s*}}/g, options.projectName)
    .replace(/{{\s*description\s*}}/g, options.description ?? '')
    .replace(/{{\s*template\s*}}/g, options.template)
    .replace(/{{\s*typescript\s*}}/g, String(Boolean(options.typescript)))
    .replace(/{{\s*css\s*}}/g, options.css ?? CSSType.None)
    .replace(/{{\s*framework\s*}}/g, options.framework ?? FrameworkType.React)
    .replace(/{{\s*version\s*}}/g, options.version ?? '')
    .replace(/{{\s*date\s*}}/g, options.date ?? '')
    .replace(/{{\s*cssExt\s*}}/g, options.cssExt ?? 'css')
    .replace(/{{\s*pageName\s*}}/g, options.pageName ?? 'index');
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join('');
}

function normalizeTemplateDestination(destinationPath: string): string {
  const parsedPath = path.parse(destinationPath);
  let normalizedPath = destinationPath;

  if (parsedPath.ext === '.tmpl') {
    normalizedPath = path.join(parsedPath.dir, parsedPath.name);
  }

  const basename = path.basename(normalizedPath);
  if (basename.startsWith('_')) {
    normalizedPath = path.join(path.dirname(normalizedPath), basename.slice(1));
  }

  return normalizedPath;
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
      return;
    }
    console.log(error);
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
      if (exitCode === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${exitCode}`));
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
