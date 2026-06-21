export type FixturePageIcon = 'layers' | 'form' | 'list' | 'wifi' | 'hand' | 'zap' | 'image';

export type FixturePageGradient = 'primary' | 'warm' | 'ocean' | 'rose' | 'sky' | 'success' | 'violet';

export type FixturePageBadgeVariant = 'default' | 'secondary' | 'success' | 'warning';

export interface FixturePageItem {
  title: string;
  desc: string;
  route: string;
  icon: FixturePageIcon;
  gradient: FixturePageGradient;
  badge: string;
  badgeVariant: FixturePageBadgeVariant;
  coverage: string;
  health: string;
}

export const fixturePageRoutes = {
  dashboard: 'pages/dashboard/index',
  uiLab: 'pages/ui-lab/index',
  formLab: 'pages/form-lab/index',
  listLab: 'pages/list-lab/index',
  networkLab: 'pages/network-lab/index',
  gestureLab: 'pages/gesture-lab/index',
  stateLab: 'pages/state-lab/index',
  mediaLab: 'pages/media-lab/index',
} as const;

export const fixturePages: FixturePageItem[] = [
  {
    title: '组件库',
    desc: '基础 UI 原语与 Drawer 多方向动效验证',
    route: `/${fixturePageRoutes.uiLab}`,
    icon: 'layers',
    gradient: 'primary',
    badge: 'UI',
    badgeVariant: 'default',
    coverage: '12 primitives',
    health: 'Motion ready',
  },
  {
    title: '表单测试',
    desc: '输入、滑动、开关、选择和长文本控件行为',
    route: `/${fixturePageRoutes.formLab}`,
    icon: 'form',
    gradient: 'warm',
    badge: 'Form',
    badgeVariant: 'warning',
    coverage: '10 controls',
    health: 'Validation ready',
  },
  {
    title: '列表测试',
    desc: 'ScrollView 刷新加载与 ListView 渲染',
    route: `/${fixturePageRoutes.listLab}`,
    icon: 'list',
    gradient: 'ocean',
    badge: 'List',
    badgeVariant: 'success',
    coverage: '50 records',
    health: 'Virtual ready',
  },
  {
    title: '网络测试',
    desc: '请求、拦截器、错误态与日志链路',
    route: `/${fixturePageRoutes.networkLab}`,
    icon: 'wifi',
    gradient: 'sky',
    badge: 'Net',
    badgeVariant: 'secondary',
    coverage: '3 flows',
    health: 'Interceptor ready',
  },
  {
    title: '手势测试',
    desc: '点击、拖拽、长按和事件兜底链路',
    route: `/${fixturePageRoutes.gestureLab}`,
    icon: 'hand',
    gradient: 'rose',
    badge: 'Gesture',
    badgeVariant: 'default',
    coverage: 'Tap/Pan/Press',
    health: 'Fallback ready',
  },
  {
    title: '状态测试',
    desc: 'React 19 transition、reducer、Context 与批量更新',
    route: `/${fixturePageRoutes.stateLab}`,
    icon: 'zap',
    gradient: 'success',
    badge: 'State',
    badgeVariant: 'secondary',
    coverage: 'React 19',
    health: 'Concurrent ready',
  },
  {
    title: '媒体测试',
    desc: 'Image 与 Canvas 组件渲染及样式兼容性',
    route: `/${fixturePageRoutes.mediaLab}`,
    icon: 'image',
    gradient: 'violet',
    badge: 'Media',
    badgeVariant: 'default',
    coverage: '2 components',
    health: 'Render ready',
  },
];

export const dashboardStats = [
  { label: 'Renderer', value: 'Skyline' },
  { label: 'Runtime', value: 'React 19' },
  { label: 'Target', value: 'WeApp' },
];

export const coverageItems = [
  { label: 'UI primitives', value: '12', tone: 'primary' },
  { label: 'Runtime pages', value: String(fixturePages.length), tone: 'success' },
  { label: 'Event paths', value: '18+', tone: 'warning' },
];

export const qualitySignals = ['Safe area', 'CSS Modules', 'Logs', 'Fallbacks'];
