import { View, Text } from '@spcsn/taro-components';
import Taro from '@spcsn/taro';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconCircle, SvgIcon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { coverageItems, dashboardStats, fixturePages, qualitySignals } from '@/features/fixture-navigation';
import styles from './index.module.css';

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
            React 19 × Skyline 的最小业务样板，覆盖组件、状态、列表、网络与手势链路。
          </Text>
          <View className={styles.statsGrid}>
            {dashboardStats.map((item) => (
              <View key={item.label} className={styles.statCard}>
                <Text className={styles.statValue}>{item.value}</Text>
                <Text className={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.navSection}>
          <View className={styles.coverageStrip}>
            {coverageItems.map((item) => (
              <View key={item.label} className={`${styles.coverageCard} ${styles[`coverageCard_${item.tone}`]}`}>
                <Text className={styles.coverageValue}>{item.value}</Text>
                <Text className={styles.coverageLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Card className={styles.commandCard}>
            <View className={styles.commandHeader}>
              <View>
                <Text className={styles.commandTitle}>底座健康状态</Text>
                <Text className={styles.commandDesc}>小程序端关键链路集中巡检</Text>
              </View>
              <Badge variant="success">Ready</Badge>
            </View>
            <View className={styles.signalRow}>
              {qualitySignals.map((item) => (
                <View key={item} className={styles.signalPill}>
                  <SvgIcon name="check" size={14} color="var(--success)" />
                  <Text className={styles.signalText}>{item}</Text>
                </View>
              ))}
            </View>
          </Card>

          <View className={styles.navHeader}>
            <View>
              <Text className={styles.navTitle}>验证场景</Text>
              <Text className={styles.navSubtitle}>按能力域拆分，便于回归测试</Text>
            </View>
            <Badge variant="outline">{fixturePages.length} pages</Badge>
          </View>

          <View className={styles.navList}>
            {fixturePages.map((item, idx) => (
              <View
                key={item.route}
                className={`${styles.navCardWrap} ${idx > 0 ? styles.navCardWrapSpaced : ''} stagger-${idx + 1}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <Card className={styles.navCard}>
                  <View className={styles.navCardInner} onClick={() => navigateTo(item.route)}>
                    <IconCircle name={item.icon} gradient={item.gradient} size="md" />
                    <View className={styles.navCardMain}>
                      <View className={styles.navCardTitleRow}>
                        <Text className={styles.navCardTitle}>{item.title}</Text>
                        <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                      </View>
                      <Text className={styles.navCardDesc}>{item.desc}</Text>
                      <View className={styles.navMetaRow}>
                        <Text className={styles.navMeta}>{item.coverage}</Text>
                        <Text className={styles.navMetaDot}>/</Text>
                        <Text className={styles.navMeta}>{item.health}</Text>
                      </View>
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
            <Text className={styles.footerText}>src/features · src/components · src/pages</Text>
            <Text className={styles.footerVersion}>SPCSN Taro Lite · glass-easel</Text>
          </View>
        </View>
      </View>
    </PageWrapper>
  );
}
