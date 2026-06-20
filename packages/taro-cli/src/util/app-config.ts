import type { IPluginContext } from '../internal/taro-service';

export function extractCompileEntry(
  appConfig: Record<string, unknown>,
  args: Record<string, unknown>,
  ctx: IPluginContext,
): void {
  const pages = args.pages as string | undefined;
  const components = args.components as string | undefined;
  const { sourcePath } = ctx.paths;

  if (!pages && !components) return;

  if (pages) {
    const pageList = pages.split(',').map((page) => page.trim());
    appConfig.pages = pageList;
  }

  if (components) {
    const componentList = components.split(',').map((component) => component.trim());
    appConfig.components = componentList;
  }

  void sourcePath;
}
