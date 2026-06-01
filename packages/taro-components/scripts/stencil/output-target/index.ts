import { generateProxies as generateReactProxies } from '@stencil/react-output-target/dist/output-react';
import { normalizeOutputTarget as normalizeReactOutputTarget } from '@stencil/react-output-target/dist/plugin';

import type { CompilerCtx, ComponentCompilerMeta, Config, OutputTargetCustom } from '@stencil/core/internal';
import type { OutputTargetReact } from '@stencil/react-output-target';

export function sortBy<T>(array: ReadonlyArray<T>, prop: (item: T) => string): ReadonlyArray<T> {
  return array.slice().sort((a, b) => {
    const nameA = prop(a);
    const nameB = prop(b);
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
}

function getFilteredComponents(
  excludeComponents: ReadonlyArray<string> = [],
  cmpList: ReadonlyArray<ComponentCompilerMeta>,
): ReadonlyArray<ComponentCompilerMeta> {
  return sortBy(cmpList, (cmp) => cmp.tagName).filter((c) => !excludeComponents.includes(c.tagName) && !c.internal);
}

export async function reactProxyOutput(
  config: Config,
  compilerCtx: CompilerCtx,
  outputTarget: OutputTargetReact,
  components: ReadonlyArray<ComponentCompilerMeta>,
): Promise<void> {
  const filteredComponents = getFilteredComponents(outputTarget.excludeComponents, components);
  const rootDir = config.rootDir;
  const pkgData = { types: 'dist/index.d.ts' };
  const finalText = generateReactProxies(config, filteredComponents, pkgData, outputTarget, rootDir!);
  await compilerCtx.fs.writeFile(outputTarget.proxiesFile, finalText);
  // await copyResources(config, outputTarget)
}

export const reactOutputTarget = (outputTarget: OutputTargetReact): OutputTargetCustom => ({
  type: 'custom',
  name: 'react-library',
  validate(config) {
    return normalizeReactOutputTarget(config, outputTarget);
  },
  async generator(config, compilerCtx, buildCtx) {
    const timeSpan = buildCtx.createTimeSpan(`generate react started`, true);
    await reactProxyOutput(config, compilerCtx, outputTarget, buildCtx.components);
    timeSpan.finish(`generate react finished`);
  },
});
