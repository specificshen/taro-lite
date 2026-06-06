export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/components/index',
    'pages/form/index',
    'pages/list/index',
    'pages/network/index',
    'pages/gesture/index',
    'pages/state/index',
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
