import { Kernel } from '@spcsn/taro-service';

export default function customCommand(command: string, kernel: Kernel, args: { _: string[]; [key: string]: any }) {
  if (typeof command !== 'string') return Promise.resolve();

  const options: any = {};
  const excludeKeys = ['_', 'version', 'v', 'help', 'h', 'disable-global-config'];
  Object.keys(args).forEach((key) => {
    if (!excludeKeys.includes(key)) {
      options[key] = args[key];
    }
  });

  return kernel.run({
    name: command,
    opts: {
      _: args._,
      options,
      isHelp: args.h,
    },
  });
}
