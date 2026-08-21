export function extractCompileEntry(appConfig: Record<string, unknown>, args: Record<string, unknown>): void {
  const pages = args.pages as string | undefined;

  if (!pages) return;

  const pageList = pages.split(',').map((page) => page.trim());
  appConfig.pages = pageList;
}
