import { useState, useRef } from 'react';
import { View, Text } from '@spcsn/taro-components';
import {
  TapGestureHandler as _TapGestureHandler,
  PanGestureHandler as _PanGestureHandler,
  LongPressGestureHandler as _LongPressGestureHandler,
} from '@spcsn/taro-components';

// Skyline gesture handlers expose runtime event props not present in current type declarations.
const TapGestureHandler = _TapGestureHandler as any;
const PanGestureHandler = _PanGestureHandler as any;
const LongPressGestureHandler = _LongPressGestureHandler as any;
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogConsole } from '@/components/demo/log-console';
import { useLogger } from '@/hooks/use-logger';
import styles from './index.module.css';

export default function GesturePage() {
  const { logs, add, clear } = useLogger();
  const [gestureLog, setGestureLog] = useState<string[]>([]);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const pushGesture = (name: string, detail?: string) => {
    const msg = detail ? `${name}: ${detail}` : name;
    setGestureLog((prev) => [msg, ...prev.slice(0, 19)]);
    add(msg, 'info');
  };

  return (
    <PageWrapper title="手势测试">
      <View className={`${styles.container} animate-fade-in-up`}>
        <Card>
          <CardHeader>
            <CardTitle>Skyline 原生手势</CardTitle>
            <CardDescription>Tap / Pan / LongPress 手势识别测试</CardDescription>
          </CardHeader>
          <CardContent>
            <View className={styles.gestureGrid}>
              {/* Tap Gesture */}
              <View className={styles.gestureItem}>
                <Text className={styles.gestureLabel}>Tap 点击</Text>
                <TapGestureHandler
                  onGestureWorklet="onTap"
                  onGestureEvent={() => pushGesture('Tap', '单次点击')}
                >
                  <View className={styles.gestureZone}>
                    <Text className={styles.gestureZoneText}>点击我</Text>
                  </View>
                </TapGestureHandler>
              </View>

              {/* Long Press Gesture */}
              <View className={styles.gestureItem}>
                <Text className={styles.gestureLabel}>LongPress 长按</Text>
                <LongPressGestureHandler
                  onGestureWorklet="onLongPress"
                  onGestureEvent={() => pushGesture('LongPress', '长按触发')}
                >
                  <View className={styles.gestureZoneSecondary}>
                    <Text className={styles.gestureZoneText}>长按我</Text>
                  </View>
                </LongPressGestureHandler>
              </View>

              {/* Pan Gesture */}
              <View className={styles.gestureItemFull}>
                <Text className={styles.gestureLabel}>Pan 拖拽</Text>
                <PanGestureHandler
                  onGestureWorklet="onPan"
                  onGestureEvent={(e: any) => {
                    const state = e.detail?.state || e.detail?.gestureState;
                    if (state === 'begin') {
                      panStart.current = { ...panPos };
                      pushGesture('Pan', '开始拖拽');
                    } else if (state === 'change' || e.detail?.deltaX !== undefined) {
                      const dx = e.detail?.deltaX || 0;
                      const dy = e.detail?.deltaY || 0;
                      setPanPos({
                        x: panStart.current.x + dx,
                        y: panStart.current.y + dy,
                      });
                    } else if (state === 'end') {
                      pushGesture('Pan', '拖拽结束');
                    }
                  }}
                >
                  <View className={styles.panArea}>
                    <View
                      className={styles.panBall}
                      style={{
                        transform: `translate3d(${panPos.x}px, ${panPos.y}px, 0)`,
                      }}
                    >
                      <Text className={styles.panBallText}>拖拽球</Text>
                    </View>
                  </View>
                </PanGestureHandler>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <View className={styles.cardHeaderRow}>
              <CardTitle>手势日志</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setGestureLog([])}>清空</Button>
            </View>
          </CardHeader>
          <CardContent>
            <View className={styles.gestureLog}>
              {gestureLog.length === 0 ? (
                <Text className={styles.gestureLogEmpty}>等待手势操作...</Text>
              ) : (
                gestureLog.map((g, i) => (
                  <View key={i} className={styles.gestureLogRow}>
                    <Badge variant="outline">#{gestureLog.length - i}</Badge>
                    <Text className={styles.gestureLogText}>{g}</Text>
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
