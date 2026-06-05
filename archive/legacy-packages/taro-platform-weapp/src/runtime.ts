import { mergeInternalComponents, mergeReconciler } from '@spcsn/taro-shared';

import { components, hostConfig } from './runtime-utils';

mergeReconciler(hostConfig);
mergeInternalComponents(components);
