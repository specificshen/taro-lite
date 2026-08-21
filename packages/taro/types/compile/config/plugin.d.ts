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
