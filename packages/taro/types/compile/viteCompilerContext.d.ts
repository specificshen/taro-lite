import type { IMiniAppConfig, IMiniFilesConfig } from './config'
import type { IProjectConfig } from './config/project'
import type { IComponentConfig } from './hooks'
import type { AppConfig, PageConfig } from '../index'

type RollupPluginContext = any

export interface ViteNativeCompMeta {
  name: string
  exportName: string
  scriptPath: string
  configPath: string
  config: PageConfig
  isNative: true
  templatePath: string
  cssPath?: string
  isPackage?: boolean
  isGenerated?: boolean
}

export interface ViteFileType {
  config: string
  script: string
  templ: string
  style: string
  xs?: string
}

export interface ViteMiniTemplate {
  isSupportRecursive: boolean
  isUseCompileMode?: boolean
  isUseXS?: boolean
  buildBaseComponentTemplate: (ext: string) => string
  buildCustomComponentTemplate: (ext: string) => string
  buildPageTemplate: (baseTempPath: string, page?: { content: Record<string, any>; path: string }) => string
  buildTemplate: (componentConfig: IComponentConfig) => string
  buildXScript: () => string
}

export interface ViteAppMeta {
  name: string
  scriptPath: string
  configPath: string
  config: AppConfig
  isNative: false
}

export interface VitePageMeta {
  name: string
  scriptPath: string
  configPath: string
  config: PageConfig
  isNative: boolean
  templatePath?: string
  cssPath?: string
}

export interface CommonBuildConfig extends IProjectConfig<'vite'> {
  entry: {
    app: string | string[]
  }
  mode: 'production' | 'development' | 'none'
  buildAdapter: string // weapp | swan | alipay | tt | qq | jd | h5
  platformType: string // mini | web
  /** special mode */
  isBuildNativeComp?: boolean
  /** hooks */
  onParseCreateElement: (nodeName, componentConfig) => Promise<any>
}


export interface ViteMiniBuildConfig extends CommonBuildConfig, IMiniAppConfig<'vite'> {
  isBuildPlugin: boolean
  isSupportRecursive: boolean
  isSupportXS: boolean
  nodeModulesPath: string
  fileType: ViteFileType
  globalObject: string
  template: ViteMiniTemplate
  runtimePath?: string | string[]
  taroComponentsPath: string
  blended?: boolean
  hot?: boolean
  injectOptions?: {
    include?: Record<string, string | string[]>
    exclude?: string[]
  }
  /** hooks */
  modifyComponentConfig: (componentConfig: IComponentConfig, config: Partial<ViteMiniBuildConfig>) => Promise<any>
}

export interface ViteCompilerContext<T> {
  cwd: string
  sourceDir: string
  taroConfig: T
  rawTaroConfig: T
  frameworkExts: string[]
  app: ViteAppMeta
  pages: VitePageMeta[]
  components?: VitePageMeta[]
  loaderMeta: any
  logger
  filesConfig: IMiniFilesConfig
  configFileList: string[]
  init: () => Promise<void>
  compilePage: (pageName: string) => Promise<VitePageMeta>
  watchConfigFile: (rollupCtx: RollupPluginContext) => void
  collectedDeps: (rollupCtx: RollupPluginContext, id: string, filter, cache: Set<string> = new Set()) => Promise<Set<string>>
  getAppScriptPath: () => string
  getApp: () => Promise<ViteAppMeta>
  getPages: () => Promise<VitePageMeta[]>
  isApp: (id: string) => boolean
  isPage: (id: string) => boolean
  isComponent: (id: string) => boolean
  isNativePageORComponent: (templatePath: string) => boolean
  getPageById: (id: string) => VitePageMeta| undefined
  getComponentById: (id: string) => VitePageMeta| undefined
  getConfigFilePath: (filePath: string) => string
  getTargetFilePath: (filePath: string, targetExtName: string) => string
}

export interface ViteMiniCompilerContext extends ViteCompilerContext<ViteMiniBuildConfig> {
  fileType: ViteFileType
  commonChunks: string[]
  nativeComponents : Map<string, ViteNativeCompMeta>
  getCommonChunks: () => string[]
  resolvePageImportPath: (scriptPath: string, pageName: string) => string
  collectNativeComponents: (meta: ViteAppMeta | VitePageMeta | ViteNativeCompMeta) => Promise<ViteNativeCompMeta[]>
  generateNativeComponent: (rollupCtx: RollupPluginContext, meta: ViteNativeCompMeta) => void
  getScriptPath: (filePath: string) => string
  getTemplatePath: (filePath: string) => string
  getStylePath: (filePath: string) => string
  getConfigPath: (filePath: string) => string
}
