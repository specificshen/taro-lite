import { validateConfig } from './validators';

export default {
  validators: [
    (args: { projectConfig: unknown }) => validateConfig(args.projectConfig as Parameters<typeof validateConfig>[0]),
  ],
};
