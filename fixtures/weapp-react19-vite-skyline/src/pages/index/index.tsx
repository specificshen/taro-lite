import { View, Text } from '@spcsn/taro-components';
import Taro from '@spcsn/taro';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import styles from './index.module.css';

interface NavItem {
  title: string;
  desc: string;
  path: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'success' | 'warning';
}

const navItems: NavItem[] = [
  {
    title: '组件库',
    desc: 'Card, Badge, Button, Input, Avatar, Skeleton 等基础组件展示',
    path: '/pages/components/index',
    badge: 'UI',
    badgeVariant: 'default',
  },
  {
    title: '表单测试',
    desc: '输入验证、Slider、Switch、Radio 等表单控件底座覆盖',
    path: '/pages/form/index',
    badge: 'Form',
    badgeVariant: 'secondary',
  },
  {
    title: '列表测试',
    desc: 'ScrollView 下拉刷新、上拉加载、ListView 高性能渲染',
    path: '/pages/list/index',
    badge: 'List',
    badgeVariant: 'success',
  },
  {
    title: '网络测试',
    desc: 'Taro.request、Interceptor、GET/POST、错误模拟',
    path: '/pages/network/index',
    badge: 'Net',
    badgeVariant: 'warning',
  },
  {
    title: '手势测试',
    desc: 'Skyline Tap / Pan / LongPress 原生手势识别',
    path: '/pages/gesture/index',
    badge: 'Gesture',
    badgeVariant: 'default',
  },
  {
    title: '状态测试',
    desc: 'useTransition、useReducer、Context、批量更新',
    path: '/pages/state/index',
    badge: 'State',
    badgeVariant: 'secondary',
  },
];

export default function IndexPage() {
  const navigateTo = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  return (
    <PageWrapper title="Taro Lite Sandbox">
      <View className={styles.container}>
        {/* Hero Banner */}
        <View className={styles.hero}>
          <Text className={styles.heroTitle}>SPCSN Taro Lite</Text>
          <Text className={styles.heroSub}>React 19 + Vite + Skyline / glass-easel 底座验证工程</Text>
          <View className={styles.heroBadges}>
            <Badge variant="default">React 19</Badge>
            <Badge variant="secondary">Vite</Badge>
            <Badge variant="success">Skyline</Badge>
            <Badge variant="outline">glass-easel</Badge>
          </View>
        </View>

        {/* Navigation Grid */}
        <View className={styles.navSection}>
          <Text className={styles.navTitle}>测试导航</Text>
          <View className={styles.navGrid}>
            {navItems.map((item) => (
              <Card key={item.path} className={styles.navCard}>
                <View className={styles.navCardInner} onClick={() => navigateTo(item.path)}>
                  <View className={styles.navCardHeader}>
                    <Text className={styles.navCardTitle}>{item.title}</Text>
                    {item.badge && (
                      <Badge variant={item.badgeVariant || 'default'}>{item.badge}</Badge>
                    )}
                  </View>
                  <Text className={styles.navCardDesc}>{item.desc}</Text>
                  <View className={styles.navCardArrow}>
                    <Text className={styles.navCardArrowText}>→</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Footer Info */}
        <View className={styles.footer}>
          <Separator />
          <Text className={styles.footerText}>
            {'基于 shadcn 设计规范 · 目录结构: src/{components,lib,hooks,pages,styles}'}
          </Text>
        </View>
      </View>
    </PageWrapper>
  );
}
