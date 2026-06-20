import {
  getComponentsAlias as getComponentsAliasFromShared,
  internalComponents as internalComponentsFromShared,
  mergeInternalComponents as mergeInternalComponentsFromShared,
} from './shared-compat/utils';

export const internalComponents = internalComponentsFromShared;
export const getComponentsAlias = getComponentsAliasFromShared;
export const mergeInternalComponents = mergeInternalComponentsFromShared;
