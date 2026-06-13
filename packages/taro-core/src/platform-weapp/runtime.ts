import { mergeInternalComponents, mergeReconciler } from '@spcsn/taro-shared';
import { components } from './components.js';
import { hostConfig } from './runtime-utils.js';

mergeReconciler(hostConfig);
mergeInternalComponents(components);
