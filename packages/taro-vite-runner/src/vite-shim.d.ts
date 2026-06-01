declare module 'vite' {
  export type Alias = any
  export type CSSModulesOptions = any
  export type InlineConfig = any
  export type Logger = any
  export type Plugin = any
  export type PluginOption = any
  export type ResolvedConfig = any
  export type ResolveFn = any
  export type UserConfig = any

  export function build(config?: any): Promise<any>
  export function createLogger(...args: any[]): any
  export function createServer(config?: any): Promise<any>
  export function normalizePath(path: string): string
  export function searchForWorkspaceRoot(path: string): string
}

