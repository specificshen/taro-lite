import { Text, View } from '@spcsn/taro-components';
import { useState } from 'react';
import { LogConsole } from '@/components/demo/log-console';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { DrawerSide } from '@/components/ui/drawer';
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLogger } from '@/hooks/use-logger';
import styles from './index.module.css';

const drawerSides: Array<{ label: string; value: DrawerSide }> = [
  { label: '底部', value: 'bottom' },
  { label: '右侧', value: 'right' },
  { label: '左侧', value: 'left' },
  { label: '顶部', value: 'top' },
];

const componentMetrics = [
  { label: '基础原语', value: '12', desc: 'Button / Card / Badge / Input' },
  { label: '反馈状态', value: '5', desc: '成功、警告、危险、加载、空态' },
  { label: '动效方位', value: '4', desc: 'Drawer 多方向进退场' },
];

const tokenSwatches = [
  { label: 'Primary', className: 'swatchPrimary' },
  { label: 'Success', className: 'swatchSuccess' },
  { label: 'Warning', className: 'swatchWarning' },
  { label: 'Rose', className: 'swatchRose' },
];

export default function ComponentsPage() {
  const { logs, add, clear } = useLogger();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<DrawerSide>('bottom');

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const handleDemoAction = (name: string) => {
    add(`点击了 ${name}`, 'info');
  };

  const triggerSkeleton = () => {
    setLoading(true);
    add('Skeleton 加载演示开始', 'info');
    setTimeout(() => {
      setLoading(false);
      add('Skeleton 加载演示结束', 'success');
    }, 2000);
  };

  const openDrawer = (side: typeof drawerSide) => {
    setDrawerSide(side);
    setDrawerOpen(true);
    add(`打开 ${side} 抽屉`, 'info');
  };

  return (
    <PageWrapper title="组件库">
      <View className={`${styles.container} animate-fade-in-up`}>
        <View className={styles.labHero}>
          <Text className={styles.labEyebrow}>Primitive Lab</Text>
          <Text className={styles.labTitle}>UI 原语实验室</Text>
          <Text className={styles.labDesc}>
            覆盖布局、反馈、输入、头像、骨架屏与抽屉动效，方便快速发现端上样式差异。
          </Text>
        </View>

        <View className={styles.metricGrid}>
          {componentMetrics.map((item) => (
            <View key={item.label} className={styles.metricCard}>
              <Text className={styles.metricValue}>{item.value}</Text>
              <Text className={styles.metricLabel}>{item.label}</Text>
              <Text className={styles.metricDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>

        <View className={`${styles.section} ${styles.sectionSpaced}`}>
          <Text className={styles.sectionTitle}>Design Tokens</Text>
          <Text className={styles.mutedText}>颜色、圆角、阴影、动效都从页面 token 读取，端上覆盖更容易定位。</Text>
          <View className={styles.swatchGrid}>
            {tokenSwatches.map((item) => (
              <View key={item.label} className={styles.swatchCard}>
                <View className={`${styles.swatchBlock} ${styles[item.className]}`} />
                <Text className={styles.swatchText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card Demo */}
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>Card 卡片</Text>
          <Card>
            <CardHeader>
              <CardTitle>账户概览</CardTitle>
              <CardDescription>查看您的账户状态和最近活动</CardDescription>
            </CardHeader>
            <CardContent>
              <Text className={styles.cardBodyText}>余额: ¥12,580.00</Text>
              <Text className={styles.cardBodyText}>本月支出: ¥3,240.00</Text>
            </CardContent>
            <CardFooter className={styles.cardActions}>
              <Button size="sm" onClick={() => handleDemoAction('Card 主要操作')}>
                查看详情
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleDemoAction('Card 次要操作')}>
                导出
              </Button>
            </CardFooter>
          </Card>
        </View>

        {/* Badge Demo */}
        <View className={`${styles.section} ${styles.sectionSpaced}`}>
          <Text className={styles.sectionTitle}>Badge 徽标</Text>
          <View className={styles.badgeRow}>
            <Badge className={styles.badgeItem}>默认</Badge>
            <Badge className={styles.badgeItem} variant="secondary">
              次要
            </Badge>
            <Badge className={styles.badgeItem} variant="success">
              成功
            </Badge>
            <Badge className={styles.badgeItem} variant="warning">
              警告
            </Badge>
            <Badge className={styles.badgeItem} variant="destructive">
              危险
            </Badge>
            <Badge className={styles.badgeItem} variant="outline">
              边框
            </Badge>
          </View>
        </View>

        {/* Button Demo */}
        <View className={`${styles.section} ${styles.sectionSpaced}`}>
          <Text className={styles.sectionTitle}>Button 按钮</Text>
          <View className={styles.buttonStack}>
            <Button className={styles.buttonBlock} onClick={() => handleDemoAction('默认按钮')}>
              默认按钮
            </Button>
            <Button className={styles.buttonBlock} variant="secondary" onClick={() => handleDemoAction('次要按钮')}>
              次要按钮
            </Button>
            <Button className={styles.buttonBlock} variant="destructive" onClick={() => handleDemoAction('危险按钮')}>
              危险按钮
            </Button>
            <Button className={styles.buttonBlock} variant="outline" onClick={() => handleDemoAction('边框按钮')}>
              边框按钮
            </Button>
            <Button className={styles.buttonBlock} variant="ghost" onClick={() => handleDemoAction('幽灵按钮')}>
              幽灵按钮
            </Button>
            <View className={styles.buttonSizeRow}>
              <Button className={styles.buttonSizeButton} size="sm" onClick={() => handleDemoAction('小按钮')}>
                小
              </Button>
              <Button className={styles.buttonSizeButton} size="default" onClick={() => handleDemoAction('默认按钮')}>
                默认
              </Button>
              <Button className={styles.buttonSizeButton} size="lg" onClick={() => handleDemoAction('大按钮')}>
                大
              </Button>
            </View>
          </View>
        </View>

        {/* Input Demo */}
        <View className={`${styles.section} ${styles.sectionSpaced}`}>
          <Text className={styles.sectionTitle}>Input 输入框</Text>
          <View className={styles.inputStack}>
            <Input
              className={styles.inputControl}
              placeholder="请输入内容..."
              value={inputValue}
              onInput={setInputValue}
            />
            <Input className={styles.inputControl} placeholder="禁用状态" disabled />
            <Input className={styles.inputControl} placeholder="密码输入" password />
            <Text className={styles.inputValue}>当前值: {inputValue || '(空)'}</Text>
          </View>
        </View>

        {/* Avatar Demo */}
        <View className={`${styles.section} ${styles.sectionSpaced}`}>
          <Text className={styles.sectionTitle}>Avatar 头像</Text>
          <View className={styles.rowGap}>
            <Avatar>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
              <AvatarFallback>FX</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>CD</AvatarFallback>
            </Avatar>
          </View>
        </View>

        {/* Separator Demo */}
        <View className={`${styles.section} ${styles.sectionSpaced}`}>
          <Text className={styles.sectionTitle}>Separator 分割线</Text>
          <Text className={styles.mutedText}>水平分割线</Text>
          <Separator />
          <Text className={styles.mutedText}>垂直分割线</Text>
          <View className={styles.rowCenter}>
            <Text>左侧</Text>
            <Separator orientation="vertical" />
            <Text>右侧</Text>
          </View>
        </View>

        {/* Skeleton Demo */}
        <View className={`${styles.section} ${styles.sectionSpaced}`}>
          <Text className={styles.sectionTitle}>Skeleton 骨架屏</Text>
          <Button variant="outline" onClick={triggerSkeleton}>
            {loading ? '加载中...' : '触发骨架屏'}
          </Button>
          <View className={styles.skeletonArea}>
            {loading ? (
              <>
                <Skeleton className={styles.skeletonTitle} />
                <Skeleton className={styles.skeletonLine} />
                <Skeleton className={styles.skeletonLine} />
                <Skeleton className={styles.skeletonLineShort} />
              </>
            ) : (
              <>
                <Text className={styles.skeletonRealTitle}>内容已加载</Text>
                <Text className={styles.skeletonRealLine}>这是第一行真实内容</Text>
                <Text className={styles.skeletonRealLine}>这是第二行真实内容</Text>
                <Text className={styles.skeletonRealLine}>这是第三行真实内容</Text>
              </>
            )}
          </View>
        </View>

        {/* Drawer Demo */}
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>Drawer 抽屉</Text>
          <Text className={styles.mutedText}>
            验证受控关闭时的退场动画：按钮、遮罩、确认按钮都应先播放收起动效，再卸载节点。
          </Text>
          <View className={styles.drawerTriggerGrid}>
            {drawerSides.map((item) => (
              <Button
                key={item.value}
                className={styles.drawerTriggerButton}
                variant="outline"
                onClick={() => openDrawer(item.value)}
              >
                {item.label}抽屉
              </Button>
            ))}
          </View>
        </View>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} side={drawerSide}>
          <DrawerHeader>
            <DrawerClose onClick={closeDrawer} />
            <DrawerTitle>{drawerSides.find((item) => item.value === drawerSide)?.label}抽屉</DrawerTitle>
            <DrawerDescription>受控 open=false 时保留挂载，等退场动画完成后再卸载。</DrawerDescription>
          </DrawerHeader>
          <View className={styles.drawerBody}>
            <Text className={styles.drawerBodyText}>这个样例专门覆盖 Skyline 下的 Drawer 弹出 / 收起链路。</Text>
            <Text className={`${styles.drawerBodyText} ${styles.drawerBodyTextSpaced}`}>
              点击遮罩层、右上角关闭、取消或确认，应该看到同一套平滑收起动画。
            </Text>
          </View>
          <DrawerFooter>
            <Button variant="secondary" onClick={closeDrawer}>
              取消
            </Button>
            <Button
              onClick={() => {
                closeDrawer();
                add('抽屉确认操作', 'success');
              }}
            >
              确认
            </Button>
          </DrawerFooter>
        </Drawer>

        <LogConsole logs={logs} onClear={clear} />
      </View>
    </PageWrapper>
  );
}
