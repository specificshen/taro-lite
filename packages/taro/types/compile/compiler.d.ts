export type SwcConfig = Record<string, any>

export type CompilerViteTypes = 'vite'

export type CompilerTypes = CompilerViteTypes

interface IPrebundle {
  enable?: boolean
  timings?: boolean
  cacheDir?: string
  force?: boolean
  include?: string[]
  exclude?: string[]
  esbuild?: Record<string, any>
  swc?: SwcConfig
}

interface ICompiler<T> {
  type: T
  prebundle?: IPrebundle
  vitePlugins?: any
  /** 错误处理级别。可选值：0、1 */
  errorLevel?: number
}

export type Compiler<T extends CompilerTypes = CompilerViteTypes> = T | ICompiler<T>
