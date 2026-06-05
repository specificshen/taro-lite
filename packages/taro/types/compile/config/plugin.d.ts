type RollupCustomPluginOptions = Record<string, any>

type RollupResolvedId = {
  id: string
  external?: boolean | 'absolute' | 'relative'
  meta?: Record<string, any>
  moduleSideEffects?: boolean | 'no-treeshake' | null
  syntheticNamedExports?: boolean | string
}

type RollupResolveIdResult = string | false | null | RollupResolvedId

interface IRollupPluginResolveIdOptions {
  assertions?: Record<string, string>
  custom?: RollupCustomPluginOptions
  isEntry?: boolean
  skipSelf?: boolean
}

export type TRollupResolveMethod = (
  source: string,
  importer?: string,
  options?: IRollupPluginResolveIdOptions
) => Promise<RollupResolvedId | null>

export interface ILoaderMeta {
  importFrameworkStatement: string
  importFrameworkName: string
  creator: string
  creatorLocation: string
  extraImportForWeb: string
  execBeforeCreateWebApp: string
  frameworkArgs: string
  isNeedRawLoader?: boolean
  mockAppStatement: string
  modifyConfig?: (config: Record<string, any>, source: string) => void
  modifyResolveId?: (res: {
    source?: string
    importer?: string
    options?: IRollupPluginResolveIdOptions
    name?: string
    resolve: TRollupResolveMethod
  }) => Promise<RollupResolveIdResult> | RollupResolveIdResult
}
