import Config from './service-config';
import Kernel from './service-kernel';
import { TaroPlatform, TaroPlatformBase } from './platform-plugin-base';

export * from './utils/types';
export { Config, Kernel, TaroPlatform, TaroPlatformBase };
export default { Config, Kernel, TaroPlatform, TaroPlatformBase };

export type { IPluginContext } from './utils/types';
