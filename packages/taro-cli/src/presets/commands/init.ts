import { NpmType } from '../../create/template-creator';
import type { IPluginContext } from '../../internal/taro-service';

export default (ctx: IPluginContext) => {
  ctx.registerCommand({
    name: 'init',
    optionsMap: {
      '--name [name]': '项目名称',
      '--description [description]': '项目介绍',
      '--npm [npm]': '包管理工具',
      '--template-source [templateSource]': '项目模板源',
      '--clone [clone]': '拉取远程模板时使用 git clone',
      '--template [template]': '项目模板',
      '--autoInstall': '自动安装依赖',
      '-h, --help': 'output usage information',
    },
    async fn(opts) {
      const { appPath } = ctx.paths;
      const { projectName, templateSource, clone, template, description, npm, autoInstall } = opts.options as Record<
        string,
        unknown
      >;

      const { default: Project } = await import('../../create/project.js');
      const project = new Project({
        projectDir: appPath,
        projectName: projectName as string | undefined,
        description: description as string | undefined,
        npm: npm as NpmType | undefined,
        templateSource: templateSource as string | undefined,
        clone: clone as boolean | undefined,
        template: template as string | undefined,
        autoInstall: autoInstall as boolean | undefined,
      });

      await project.create();
    },
  });
};
