import path from 'node:path';
import type { PageConfig } from '@spcsn/taro';
import { isArray, isFunction } from '@spcsn/taro/runtime';
import type {
  ViteAppMeta,
  ViteFileType,
  ViteMiniBuildConfig,
  ViteMiniCompilerContext,
  ViteNativeCompMeta,
  VitePageMeta,
} from '@spcsn/taro/types/compile/vite-compiler-context';
import type { Rolldown } from 'vite';
import {
  fs,
  isAliasPath,
  readConfig,
  recursiveMerge,
  replaceAliasPath,
  resolveMainFilePath,
} from '../../../taro-helper';
import defaultConfig from '../../mini-program/default-config';
import { miniTemplateLoader, QUERY_IS_NATIVE_COMP } from '../../mini-program/native-support';
import { getComponentName } from '..';
import { componentConfig } from '../component';
import { CompilerContext } from './base';

export class TaroCompilerContext extends CompilerContext<ViteMiniBuildConfig> implements ViteMiniCompilerContext {
  fileType: ViteFileType;
  commonChunks: string[];
  nativeComponents = new Map<string, ViteNativeCompMeta>();

  constructor(appPath: string, taroConfig: ViteMiniBuildConfig) {
    super(appPath, taroConfig);

    this.fileType = this.taroConfig.fileType;
    this.commonChunks = this.getCommonChunks();
  }

  processConfig() {
    this.taroConfig = recursiveMerge({}, defaultConfig, this.rawTaroConfig);
  }

  async init(): Promise<void> {
    await super.init();
    await this.collectNativeComponents(this.app);
    this.pages = await this.getPages();
  }

  getCommonChunks() {
    const { commonChunks } = this.taroConfig;
    const defaultCommonChunks = ['runtime', 'vendors', 'taro', 'common'];
    let customCommonChunks: string[] = defaultCommonChunks;
    if (isFunction(commonChunks)) {
      customCommonChunks =
        (commonChunks as (commonChunks: string[]) => string[])(defaultCommonChunks.concat()) || defaultCommonChunks;
    } else if (isArray(commonChunks) && commonChunks!.length) {
      customCommonChunks = commonChunks as string[];
    }
    return customCommonChunks;
  }

  compilePage = async (pageName: string): Promise<VitePageMeta> => {
    const { sourceDir, frameworkExts } = this;

    const scriptPath = resolveMainFilePath(path.join(sourceDir, pageName), frameworkExts);
    const templatePath = this.getTemplatePath(scriptPath);
    const isNative = this.isNativePageORComponent(templatePath);
    const configPath = isNative ? this.getConfigPath(scriptPath) : this.getConfigFilePath(scriptPath);
    const config: PageConfig = (await readConfig(configPath, this.taroConfig)) || {};

    const pageMeta = {
      name: pageName,
      scriptPath,
      configPath,
      config,
      isNative,
      templatePath: isNative ? templatePath : undefined,
      cssPath: isNative ? this.getStylePath(scriptPath) : undefined,
    };

    this.filesConfig[this.getConfigFilePath(pageMeta.name)] = {
      path: configPath,
      content: config,
    };
    await this.collectNativeComponents(pageMeta);
    this.configFileList.push(pageMeta.configPath);

    return pageMeta;
  };

  resolvePageImportPath(scriptPath: string, importPath: string) {
    const alias = this.taroConfig.alias;
    if (isAliasPath(importPath, alias)) {
      importPath = replaceAliasPath(scriptPath, importPath, alias);
    }
    return importPath;
  }

  async collectNativeComponents(meta: ViteAppMeta | VitePageMeta | ViteNativeCompMeta): Promise<ViteNativeCompMeta[]> {
    const { name, scriptPath, config } = meta;
    const { usingComponents } = config;

    const list: ViteNativeCompMeta[] = [];
    if (!usingComponents) return list;

    for (const [compName, value] of Object.entries(usingComponents)) {
      const compPath = Array.isArray(value) ? value[0] : value;
      usingComponents[compName] = this.resolvePageImportPath(scriptPath, compPath);
      const compScriptPath = resolveMainFilePath(path.resolve(path.dirname(scriptPath), compPath));
      if (this.nativeComponents.has(compScriptPath)) continue;

      const configPath = this.getConfigPath(compScriptPath);
      const templatePath = this.getTemplatePath(compScriptPath);
      const cssPath = this.getStylePath(compScriptPath);

      if (!fs.existsSync(compScriptPath)) {
        this.logger.warn(`找不到页面 ${name} 依赖的自定义组件：${compScriptPath}`);
        continue;
      }

      const nativeCompMeta: ViteNativeCompMeta = {
        name: getComponentName(this, compScriptPath),
        exportName: 'default',
        scriptPath: compScriptPath,
        configPath,
        config: (await readConfig(configPath)) || {},
        templatePath,
        cssPath,
        isNative: true,
      };

      this.filesConfig[this.getConfigFilePath(nativeCompMeta.name)] = {
        path: configPath,
        content: nativeCompMeta.config,
      };
      this.nativeComponents.set(compScriptPath, nativeCompMeta);
      this.configFileList.push(nativeCompMeta.configPath);
      if (!componentConfig.thirdPartyComponents.has(compName) && !meta.isNative) {
        componentConfig.thirdPartyComponents.set(compName, new Set());
      }

      list.push(...(await this.collectNativeComponents(nativeCompMeta)), nativeCompMeta);
    }
    return list;
  }

  generateNativeComponent(rollupCtx: Rolldown.PluginContext, meta: ViteNativeCompMeta) {
    if (meta.isGenerated) return;

    rollupCtx.emitFile({
      type: 'chunk',
      id: meta.scriptPath + QUERY_IS_NATIVE_COMP,
      fileName: this.getScriptPath(meta.name),
    });
    const source = miniTemplateLoader(rollupCtx, meta.templatePath, this.sourceDir);
    rollupCtx.emitFile({
      type: 'asset',
      fileName: this.getTemplatePath(meta.name),
      source,
    });
    meta.cssPath && rollupCtx.addWatchFile(meta.cssPath);
    meta.isGenerated = true;
  }

  /** 工具函数 */
  getScriptPath(filePath: string) {
    return this.getTargetFilePath(filePath, this.fileType.script);
  }

  getTemplatePath(filePath: string) {
    return this.getTargetFilePath(filePath, this.fileType.templ);
  }

  getStylePath(filePath: string) {
    return this.getTargetFilePath(filePath, this.fileType.style);
  }

  getConfigPath(filePath: string) {
    return this.getTargetFilePath(filePath, this.fileType.config);
  }
}
