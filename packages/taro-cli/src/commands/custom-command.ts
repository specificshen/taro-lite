import type { Kernel } from '../internal/taro-service';

interface CustomCommandArgs {
  _: string[];
  [key: string]: unknown;
}

export default function customCommand(command: string, kernel: Kernel, args: CustomCommandArgs): Promise<unknown> {
  if (typeof command !== 'string') return Promise.resolve();

  const options: Record<string, unknown> = {};
  const excludeKeys = new Set(['_', 'version', 'v', 'help', 'h', 'disable-global-config']);

  for (const key of Object.keys(args)) {
    if (!excludeKeys.has(key)) {
      options[key] = args[key];
    }
  }

  return kernel.run({
    name: command,
    opts: {
      _: args._,
      options,
      isHelp: args.h === true,
    },
  });
}
