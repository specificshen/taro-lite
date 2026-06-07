import { View, Text } from '@spcsn/taro-components';
import Taro from '@spcsn/taro';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconCircle } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import styles from './index.module.css';

interface NavItem {
  title: string;
  desc: string;
  path: string;
  icon: 'layers' | 'form' | 'list' | 'wifi' | 'hand' | 'zap';
  gradient: 'primary' | 'warm' | 'ocean' | 'rose' | 'sky' | 'success';
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'success' | 'warning';
}

const navItems: NavItem[] = [
  {
    title: '组件库',
    desc: 'Card, Badge, Button, Input, Drawer 等基础组件',
    path: '/pages/components/index',
    icon: 'layers',
    gradient: 'primary',
    badge: 'UI',
    badgeVariant: 'default',
  },
  {
    title: '表单测试',
    desc: '输入验证、Slider、Switch、Radio 等控件',
    path: '/pages/form/index',
    icon: 'form',
    gradient: 'warm',
    badge: 'Form',
    badgeVariant: 'warning',
  },
  {
    title: '列表测试',
    desc: 'ScrollView 刷新加载、ListView 高性能渲染',
    path: '/pages/list/index',
    icon: 'list',
    gradient: 'ocean',
    badge: 'List',
    badgeVariant: 'success',
  },
  {
    title: '网络测试',
    desc: 'Taro.request、Interceptor、错误模拟',
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
    desc: 'useTransition、useReducer、Context、批量更新',
    path: '/pages/state/index',
    icon: 'zap',
    gradient: 'success',
    badge: 'State',
    badgeVariant: 'secondary',
  },
];

export default function IndexPage() {
  const navigateTo = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  return (
    <PageWrapper title="Taro Lite">
      <View className={`${styles.container} animate-fade-in-up`}>
        {/* Hero Banner */}
        <View className={styles.hero}>
          <View className={styles.heroGlow} />
          <Text className={styles.heroTitle}>Taro Lite</Text>
          <Text className={styles.heroSub}>React 19 + Vite + Skyline 底座验证工程</Text>
          <View className={styles.heroBadges}>
            <Badge variant="default">React 19</Badge>
            <Badge variant="secondary">Vite</Badge>
            <Badge variant="success">Skyline</Badge>
            <Badge variant="outline">glass-easel</Badge>
          </View>
        </View>

        {/* Navigation Grid */}
        <View className={styles.navSection}>
          <View className={styles.navHeader}>
            <Text className={styles.navTitle}>测试导航</Text>
            <Text className={styles.navSubtitle}>6 个底座验证场景</Text>
          </View>
          <View className={styles.navGrid}>
            {navItems.map((item, idx) => (
              <View
                key={item.path}
                className={`${styles.navCardWrap} stagger-${idx + 1}`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <Card className={styles.navCard}>
                  <View className={styles.navCardInner} onClick={() => navigateTo(item.path)}>
                    <View className={styles.navCardTop}>
                      <IconCircle name={item.icon} gradient={item.gradient} size="md" />
                      {item.badge && (
                        <Badge variant={item.badgeVariant || 'default'}>{item.badge}</Badge>
                      )}
                    </View>
                    <Text className={styles.navCardTitle}>{item.title}</Text>
                    <Text className={styles.navCardDesc}>{item.desc}</Text>
                    <View className={styles.navCardArrow}>
                      <Text className={styles.navCardArrowText}>进入测试 →</Text>
                    </View>
                  </View>
                </Card>
              </View>
            ))}
          </View>
        </View>

        {/* Footer Info */}
        <View className={styles.footer}>
          <Separator />
          <View className={styles.footerContent}>
            <Text className={styles.footerText}>
              {'基于 shadcn 设计规范 · 目录结构: src/{components,lib,hooks,pages,styles}'}
            </Text>
            <Text className={styles.footerVersion}>v1.0.0 · SPCSN Taro Lite</Text>
          </View>
        </View>
      </View>
    </PageWrapper>
  );
}
