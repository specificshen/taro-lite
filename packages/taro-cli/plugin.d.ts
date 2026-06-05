export interface IPluginContext {
  runOpts: {
    options: Record<string, unknown>;
    [key: string]: unknown;
  };
  registerCommand(command: {
    name: string;
    optionsMap?: Record<string, string>;
    synopsisList?: string[];
    fn: (...args: any[]) => unknown | Promise<unknown>;
  }): void;
  onBuildStart(callback: (...args: any[]) => unknown): void;
  onBuildComplete(callback: (...args: any[]) => unknown): void;
  onBuildFinish(callback: (...args: any[]) => unknown): void;
  modifyWebpackChain(callback: (...args: any[]) => unknown): void;
  modifyBuildAssets(callback: (...args: any[]) => unknown): void;
  modifyCreateTemplate(callback: (...args: any[]) => unknown): void;
}
