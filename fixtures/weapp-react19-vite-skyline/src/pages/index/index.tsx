import { View, Text } from '@spcsn/taro-components';
import Taro from '@spcsn/taro';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconCircle, SvgIcon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import styles from './index.module.css';

interface NavItem {
  title: string;
  desc: string;
  path: string;
  icon: 'layers' | 'form' | 'list' | 'wifi' | 'hand' | 'zap';
  gradient: 'primary' | 'warm' | 'ocean' | 'rose' | 'sky' | 'success';
  badge: string;
  badgeVariant: 'default' | 'secondary' | 'success' | 'warning';
}

const navItems: NavItem[] = [
  {
    title: '组件库',
    desc: '基础 UI 原语与 Drawer 多方向动效验证',
    path: '/pages/components/index',
    icon: 'layers',
    gradient: 'primary',
    badge: 'UI',
    badgeVariant: 'default',
  },
  {
    title: '表单测试',
    desc: '输入、滑动、开关、单选等控件行为',
    path: '/pages/form/index',
    icon: 'form',
    gradient: 'warm',
    badge: 'Form',
    badgeVariant: 'warning',
  },
  {
    title: '列表测试',
    desc: 'ScrollView 刷新加载与 ListView 渲染',
    path: '/pages/list/index',
    icon: 'list',
    gradient: 'ocean',
    badge: 'List',
    badgeVariant: 'success',
  },
  {
    title: '网络测试',
    desc: '请求、拦截器、错误态与日志链路',
    path: '/pages/network/index',
    icon: 'wifi',
    gradient: 'sky',
    badge: 'Net',
    badgeVariant: 'secondary',
  },
  {
    title: '手势测试',
    desc: 'Skyline Tap / Pan / LongPress 原生手势',
    path: '/pages/gesture/index',
    icon: 'hand',
    gradient: 'rose',
    badge: 'Gesture',
    badgeVariant: 'default',
  },
  {
    title: '状态测试',
    desc: 'React 19 transition、reducer、Context 与批量更新',
    path: '/pages/state/index',
    icon: 'zap',
    gradient: 'success',
    badge: 'State',
    badgeVariant: 'secondary',
  },
];

const stats = [
  { label: 'Renderer', value: 'Skyline' },
  { label: 'Runtime', value: 'React 19' },
  { label: 'Builder', value: 'Vite' },
];

export default function IndexPage() {
  const navigateTo = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  return (
    <PageWrapper title="Taro Lite">
      <View className={`${styles.container} animate-fade-in-up`}>
        <View className={styles.hero}>
          <View className={styles.heroPattern} />
          <View className={styles.heroKicker}>
            <Text className={styles.heroKickerText}>Fixture · WeApp</Text>
          </View>
          <Text className={styles.heroTitle}>小程序底座验证台</Text>
          <Text className={styles.heroSub}>
            React 19 × Vite × Skyline 的最小业务样板，覆盖组件、状态、列表、网络与手势链路。
          </Text>
          <View className={styles.statsGrid}>
            {stats.map((item) => (
              <View key={item.label} className={styles.statCard}>
                <Text className={styles.statValue}>{item.value}</Text>
                <Text className={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.navSection}>
          <View className={styles.navHeader}>
            <View>
              <Text className={styles.navTitle}>验证场景</Text>
              <Text className={styles.navSubtitle}>按能力域拆分，便于回归测试</Text>
            </View>
            <Badge variant="outline">6 pages</Badge>
          </View>

          <View className={styles.navList}>
            {navItems.map((item, idx) => (
              <View
                key={item.path}
                className={`${styles.navCardWrap} ${idx > 0 ? styles.navCardWrapSpaced : ''} stagger-${idx + 1}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <Card className={styles.navCard}>
                  <View className={styles.navCardInner} onClick={() => navigateTo(item.path)}>
                    <IconCircle name={item.icon} gradient={item.gradient} size="md" />
                    <View className={styles.navCardMain}>
                      <View className={styles.navCardTitleRow}>
                        <Text className={styles.navCardTitle}>{item.title}</Text>
                        <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                      </View>
                      <Text className={styles.navCardDesc}>{item.desc}</Text>
                    </View>
                    <View className={styles.navCardArrow}>
                      <SvgIcon name="chevron-right" size={18} color="var(--muted-foreground)" />
                    </View>
                  </View>
                </Card>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.footer}>
          <Separator />
          <View className={styles.footerContent}>
            <Text className={styles.footerText}>src/components · src/pages · src/styles</Text>
            <Text className={styles.footerVersion}>SPCSN Taro Lite · glass-easel</Text>
          </View>
        </View>
      </View>
    </PageWrapper>
  );
}
