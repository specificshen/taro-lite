import { fixturePageRoutes } from './features/fixture-navigation';

export default defineAppConfig({
  pages: [
    fixturePageRoutes.dashboard,
    fixturePageRoutes.uiLab,
    fixturePageRoutes.formLab,
    fixturePageRoutes.listLab,
    fixturePageRoutes.networkLab,
    fixturePageRoutes.gestureLab,
    fixturePageRoutes.stateLab,
  ],
  window: {
    navigationStyle: 'custom',
    navigationBarTextStyle: 'black',
  },
  style: 'v2',
  renderer: 'skyline',
  rendererOptions: {
    skyline: {
      defaultDisplayBlock: true,
      defaultContentBox: true,
      disableABTest: false,
      sdkVersionBegin: '3.0.0',
      sdkVersionEnd: '15.255.255',
    },
  },
  componentFramework: 'glass-easel',
  lazyCodeLoading: 'requiredComponents',
});
