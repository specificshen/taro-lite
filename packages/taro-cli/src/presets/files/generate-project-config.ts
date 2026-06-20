import * as path from 'node:path';
import type { IPluginContext } from '../../internal/taro-service';

export default (ctx: IPluginContext) => {
  ctx.registerMethod(
    'generateProjectConfig',
    ({ srcConfigName, distConfigName }: { srcConfigName: string; distConfigName: string }) => {
      const { blended, newBlended } = ctx.runOpts;
      if (blended || newBlended) return;

      const { appPath, sourcePath, outputPath } = ctx.paths;
      const { printLog, processTypeEnum, fs } = ctx.helper;

      let projectConfigPath = path.join(appPath, srcConfigName);
      if (!fs.existsSync(projectConfigPath)) {
        projectConfigPath = path.join(sourcePath, srcConfigName);
        if (!fs.existsSync(projectConfigPath)) return;
      }

      const origProjectConfig = fs.readJSONSync(projectConfigPath);
      origProjectConfig.appid = process.env.TARO_APP_ID || origProjectConfig.appid;

      let distProjectConfig = origProjectConfig;
      if (origProjectConfig.compileType !== 'plugin') {
        distProjectConfig = { ...origProjectConfig, miniprogramRoot: './' };
      }

      ctx.writeFileToDist({
        filePath: distConfigName,
        content: JSON.stringify(distProjectConfig, null, 2),
      });

      if (ctx.initialConfig.logger?.quiet === false) {
        printLog(processTypeEnum.REMIND, 'appid', `${origProjectConfig.appid}`);
        printLog(processTypeEnum.GENERATE, '工具配置', `${outputPath}/${distConfigName}`);
      }
    },
  );
};
