import { mergeInternalComponents, mergeReconciler } from '@spcsn/taro-shared';
import { components } from './components';
import { hostConfig } from './runtime-utils';

mergeReconciler(hostConfig);
mergeInternalComponents(components);
