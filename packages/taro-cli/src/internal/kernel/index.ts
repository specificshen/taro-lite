import { TaroPlatform, TaroPlatformBase } from './platform-plugin-base';
import Config from './service-config';
import Kernel from './service-kernel';

export * from './utils/types';
export { Config, Kernel, TaroPlatform, TaroPlatformBase };
export default { Config, Kernel, TaroPlatform, TaroPlatformBase };

export type { IPluginContext } from './utils/types';
