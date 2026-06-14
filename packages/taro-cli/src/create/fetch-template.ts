import * as path from 'node:path';
import { chalk, fs } from '@spcsn/taro-helper';
import AdmZip from 'adm-zip';
import download from 'download-git-repo';
import ora from 'ora';
import { getTemplateSourceType, readDirWithFileTypes } from '../util/index';
import { TEMPLATE_CREATOR_FILES } from './constants';

export interface ITemplates {
  name: string;
  value: string;
  platforms?: string | string[];
  desc?: string;
  compiler?: string[];
}

const TEMP_DOWNLOAD_FOLDER = 'taro-temp';

export default async function fetchTemplate(
  templateSource: string,
  templateRootPath: string,
  clone?: boolean,
): Promise<ITemplates[]> {
  const type = getTemplateSourceType(templateSource);
  const tempPath = path.join(templateRootPath, TEMP_DOWNLOAD_FOLDER);
  let name = '';

  if (fs.existsSync(tempPath)) await fs.remove(tempPath);
  await fs.mkdirp(templateRootPath);
  await fs.mkdir(tempPath);

  await new Promise<void>((resolve) => {
    const spinner = ora(`正在从 ${templateSource} 拉取远程模板...`).start();

    if (type === 'git') {
      name = path.basename(templateSource);
      download(templateSource, path.join(tempPath, name), { clone }, async (error) => {
        if (error) {
          console.log(error);
          spinner.color = 'red';
          spinner.fail(chalk.red('拉取远程模板仓库失败！'));
          await fs.remove(tempPath);
          resolve();
          return;
        }
        spinner.color = 'green';
        spinner.succeed(`${chalk.grey('拉取远程模板仓库成功！')}`);
        resolve();
      });
    } else {
      name = 'from-remote-url';
      const zipPath = path.join(tempPath, `${name}.zip`);
      const unZipPath = path.join(tempPath, name);

      fetch(templateSource)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
          }
          await fs.writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
          const zip = new AdmZip(zipPath);
          zip.extractAllTo(unZipPath, true);
          const files = readDirWithFileTypes(unZipPath).filter(
            (file) => !file.name.startsWith('.') && file.isDirectory && file.name !== '__MACOSX',
          );

          if (files.length !== 1) {
            spinner.color = 'red';
            spinner.fail(chalk.red(`拉取远程模板仓库失败！\n${new Error('远程模板源组织格式错误')}`));
            resolve();
            return;
          }
          name = path.join(name, files[0].name);
          spinner.color = 'green';
          spinner.succeed(`${chalk.grey('拉取远程模板仓库成功！')}`);
          resolve();
        })
        .catch(async (error) => {
          spinner.color = 'red';
          spinner.fail(chalk.red(`拉取远程模板仓库失败！\n${error}`));
          await fs.remove(tempPath);
          resolve();
        });
    }
  });

  const templateFolder = name ? path.join(tempPath, name) : '';
  if (!templateFolder || !fs.existsSync(templateFolder)) return [];

  const isTemplateGroup = !(
    fs.existsSync(path.join(templateFolder, 'package.json')) ||
    fs.existsSync(path.join(templateFolder, 'package.json.tmpl'))
  );

  if (isTemplateGroup) {
    const files = readDirWithFileTypes(templateFolder)
      .filter((file) => !file.name.startsWith('.') && file.isDirectory && file.name !== '__MACOSX')
      .map((file) => file.name);

    await Promise.all(
      files.map(async (file) => {
        const src = path.join(templateFolder, file);
        const dest = path.join(templateRootPath, file);
        return fs.move(src, dest, { overwrite: true });
      }),
    );
    await fs.remove(tempPath);

    const results = await Promise.all(
      files.map(async (fileName) => {
        const creatorFile = TEMPLATE_CREATOR_FILES.map((creatorName) =>
          path.join(templateRootPath, fileName, creatorName),
        ).find((filePath) => fs.existsSync(filePath));

        if (!creatorFile) return { name: fileName, value: fileName };
        const creatorModule = await import(creatorFile);
        const meta = creatorModule.default ?? creatorModule;
        if (meta.isPrivate) return null;

        return {
          name: meta.name || fileName,
          value: fileName,
          platforms: meta.platforms || '',
          compiler: meta.compiler,
          desc: meta.desc,
        };
      }),
    );
    return results.filter(Boolean) as ITemplates[];
  }

  await fs.move(templateFolder, path.join(templateRootPath, name), { overwrite: true });
  await fs.remove(tempPath);

  let result: ITemplates = { name, value: name, desc: type === 'url' ? templateSource : '' };
  const creatorFile = TEMPLATE_CREATOR_FILES.map((creatorName) => path.join(templateRootPath, name, creatorName)).find(
    (filePath) => fs.existsSync(filePath),
  );

  if (creatorFile) {
    const creatorModule = await import(creatorFile);
    const meta = creatorModule.default ?? creatorModule;
    result = {
      name: meta.name || name,
      value: name,
      platforms: meta.platforms || '',
      compiler: meta.compiler,
      desc: meta.desc || templateSource,
    };
  }

  return [result];
}
