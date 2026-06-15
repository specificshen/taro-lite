import { Text, View } from '@spcsn/taro-components';
import { useRef, useState } from 'react';
import { LogConsole } from '@/components/demo/log-console';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogger } from '@/hooks/use-logger';
import styles from './index.module.css';

interface TouchPointLike {
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
}

interface TouchEventLike {
  touches?: TouchPointLike[];
  changedTouches?: TouchPointLike[];
}

function getTouchPoint(event: TouchEventLike): TouchPointLike | undefined {
  return event.touches?.[0] ?? event.changedTouches?.[0];
}

const gestureCards = [
  { label: 'Tap', desc: '点击事件', value: 'onClick' },
  { label: 'Press', desc: '长按兜底', value: 'press + timer' },
  { label: 'Pan', desc: '拖拽轨迹', value: 'touch move' },
];

export default function GesturePage() {
  const { logs, add, clear } = useLogger();
  const [gestureLog, setGestureLog] = useState<string[]>([]);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const touchStart = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const pushGesture = (name: string, detail?: string) => {
    const msg = detail ? `${name}: ${detail}` : name;
    setGestureLog((prev) => [msg, ...prev.slice(0, 19)]);
    add(msg, 'info');
  };

  const handlePanStart = (event: TouchEventLike) => {
    const point = getTouchPoint(event);
    if (!point) return;

    touchStart.current = { x: point.clientX ?? point.pageX ?? 0, y: point.clientY ?? point.pageY ?? 0 };
    panStart.current = { ...panPos };
    pushGesture('Pan', '开始拖拽');
  };

  const handlePanMove = (event: TouchEventLike) => {
    const point = getTouchPoint(event);
    if (!point) return;

    setPanPos({
      x: panStart.current.x + (point.clientX ?? point.pageX ?? 0) - touchStart.current.x,
      y: panStart.current.y + (point.clientY ?? point.pageY ?? 0) - touchStart.current.y,
    });
  };

  const handlePanEnd = () => {
    pushGesture('Pan', `结束拖拽 (${Math.round(panPos.x)}, ${Math.round(panPos.y)})`);
  };

  const clearLongPressTimer = () => {
    if (!longPressTimer.current) return;

    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const triggerLongPress = () => {
    if (longPressFired.current) return;

    longPressFired.current = true;
    pushGesture('LongPress', '长按触发');
  };

  const handleLongPressStart = () => {
    clearLongPressTimer();
    longPressFired.current = false;
    longPressTimer.current = setTimeout(triggerLongPress, 420);
  };

  const handleLongPressEnd = () => {
    clearLongPressTimer();
  };

  return (
    <PageWrapper title="手势测试">
      <View className={`${styles.container} animate-fade-in-up`}>
        <View className={styles.gestureHero}>
          <Text className={styles.heroTitle}>手势事件实验台</Text>
          <Text className={styles.heroDesc}>标准事件、长按兼容兜底、拖拽位移和日志链路集中验证。</Text>
        </View>

        <View className={styles.gestureCardGrid}>
          {gestureCards.map((item) => (
            <View key={item.label} className={styles.gestureInfoCard}>
              <Text className={styles.gestureInfoLabel}>{item.label}</Text>
              <Text className={styles.gestureInfoDesc}>{item.desc}</Text>
              <Text className={styles.gestureInfoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Card>
          <CardHeader>
            <CardTitle>小程序手势交互</CardTitle>
            <CardDescription>点击、长按、拖拽事件链路验证</CardDescription>
          </CardHeader>
          <CardContent>
            <View className={styles.gestureGrid}>
              <View className={styles.gestureItem}>
                <Text className={styles.gestureLabel}>Tap 点击</Text>
                <View className={styles.gestureZone} onClick={() => pushGesture('Tap', '单次点击')}>
                  <Text className={styles.gestureZoneText}>点击我</Text>
                </View>
              </View>

              <View className={`${styles.gestureItem} ${styles.gestureItemSpaced}`}>
                <Text className={styles.gestureLabel}>LongPress 长按</Text>
                <View
                  className={styles.gestureZoneSecondary}
                  onLongPress={triggerLongPress}
                  onLongClick={triggerLongPress}
                  onTouchStart={handleLongPressStart}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                >
                  <Text className={styles.gestureZoneText}>长按我</Text>
                </View>
              </View>

              <View className={`${styles.gestureItemFull} ${styles.gestureItemSpaced}`}>
                <Text className={styles.gestureLabel}>Pan 拖拽</Text>
                <View
                  className={styles.panArea}
                  catchMove
                  onTouchStart={handlePanStart}
                  onTouchMove={handlePanMove}
                  onTouchEnd={handlePanEnd}
                  onTouchCancel={handlePanEnd}
                >
                  <View
                    className={styles.panBall}
                    style={{
                      transform: `translate3d(${panPos.x}px, ${panPos.y}px, 0)`,
                    }}
                  >
                    <Text className={styles.panBallText}>拖拽球</Text>
                  </View>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card className={styles.sectionSpaced}>
          <CardHeader>
            <View className={styles.cardHeaderRow}>
              <CardTitle>手势日志</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setGestureLog([])}>
                清空
              </Button>
            </View>
          </CardHeader>
          <CardContent>
            <View className={styles.gestureLog}>
              {gestureLog.length === 0 ? (
                <Text className={styles.gestureLogEmpty}>等待手势操作...</Text>
              ) : (
                gestureLog.map((item, index) => (
                  <View key={`${item}-${index}`} className={styles.gestureLogRow}>
                    <Badge variant="outline">#{gestureLog.length - index}</Badge>
                    <Text className={styles.gestureLogText}>{item}</Text>
                  </View>
                ))
              )}
            </View>
          </CardContent>
        </Card>

        <LogConsole logs={logs} onClear={clear} />
      </View>
    </PageWrapper>
  );
}
