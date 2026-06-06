import { useState, useCallback } from 'react';
import { View, Text, ScrollView, ListView, ListItem } from '@spcsn/taro-components';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { LogConsole } from '@/components/demo/log-console';
import { useLogger } from '@/hooks/use-logger';
import { sleep, uid } from '@/lib/utils';
import styles from './index.module.css';

interface ListRecord {
  id: string;
  title: string;
  desc: string;
  status: 'active' | 'pending' | 'completed';
  date: string;
}

function generateItems(start: number, count: number): ListRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const n = start + i;
    const statuses: ListRecord['status'][] = ['active', 'pending', 'completed'];
    return {
      id: uid(),
      title: `任务 #${n}`,
      desc: `这是第 ${n} 个测试任务项，用于验证列表渲染性能`,
      status: statuses[n % 3],
      date: new Date(Date.now() - n * 86400000).toLocaleDateString(),
    };
  });
}

export default function ListPage() {
  const { logs, add, clear } = useLogger();
  const [items, setItems] = useState<ListRecord[]>(() => generateItems(1, 10));
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    add('开始下拉刷新...', 'info');
    await sleep(1200);
    setItems(generateItems(1, 10));
    setHasMore(true);
    add('下拉刷新完成，已重置列表', 'success');
    setRefreshing(false);
  }, [add]);

  const onLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    add('开始加载更多...', 'info');
    await sleep(800);
    const nextStart = items.length + 1;
    const newItems = generateItems(nextStart, 10);
    setItems((prev) => [...prev, ...newItems]);
    if (nextStart >= 50) {
      setHasMore(false);
      add('已到达最大数量限制 (50)', 'warn');
    } else {
      add(`加载更多完成，当前共 ${nextStart + 9} 条`, 'success');
    }
    setLoadingMore(false);
  }, [items.length, loadingMore, hasMore, add]);

  const onScrollToLower = useCallback(() => {
    add('ScrollView 滚动到底部', 'info');
    onLoadMore();
  }, [onLoadMore, add]);

  const statusBadge = (status: ListRecord['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">进行中</Badge>;
      case 'pending':
        return <Badge variant="warning">待处理</Badge>;
      case 'completed':
        return <Badge variant="success">已完成</Badge>;
    }
  };

  return (
    <PageWrapper title="列表测试">
      <View className={styles.container}>
        <Card>
          <CardHeader>
            <CardTitle>列表控制</CardTitle>
          </CardHeader>
          <CardContent>
            <View className={styles.controls}>
              <Button size="sm" onClick={onRefresh} disabled={refreshing}>
                {refreshing ? '刷新中...' : '手动刷新'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setItems([])}>
                清空列表
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                setItems(generateItems(1, 10));
                setHasMore(true);
                add('列表已重置', 'info');
              }}>
                重置数据
              </Button>
            </View>
            <Text className={styles.stats}>当前共 {items.length} 条数据</Text>
          </CardContent>
        </Card>

        <View className={styles.listSection}>
          <Text className={styles.sectionTitle}>ScrollView 列表</Text>
          <ScrollView
            className={styles.scrollList}
            scrollY
            refresherEnabled
            refresherTriggered={refreshing}
            onRefresherRefresh={onRefresh}
            onScrollToLower={onScrollToLower}
            lowerThreshold={100}
          >
            {items.length === 0 ? (
              <View className={styles.empty}>
                <Text className={styles.emptyText}>列表为空</Text>
              </View>
            ) : (
              items.map((item, idx) => (
                <View key={item.id}>
                  <View className={styles.listRow}>
                    <View className={styles.listRowLeft}>
                      <Text className={styles.listTitle}>{item.title}</Text>
                      <Text className={styles.listDesc}>{item.desc}</Text>
                      <Text className={styles.listDate}>{item.date}</Text>
                    </View>
                    <View className={styles.listRowRight}>
                      {statusBadge(item.status)}
                    </View>
                  </View>
                  {idx < items.length - 1 && <Separator />}
                </View>
              ))
            )}

            {items.length > 0 && (
              <View className={styles.loadMore}>
                {loadingMore ? (
                  <View className={styles.skeletonRow}>
                    <Skeleton className={styles.skeletonBar} />
                  </View>
                ) : hasMore ? (
                  <Text className={styles.loadMoreText}>上拉加载更多</Text>
                ) : (
                  <Text className={styles.loadMoreText}>没有更多了</Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>

        <View className={styles.listSection}>
          <Text className={styles.sectionTitle}>ListView 高性能列表 (Skyline)</Text>
          <ListView className={styles.skylineList}>
            {items.slice(0, 8).map((item) => (
              <ListItem key={`sky-${item.id}`}>
                <View className={styles.skylineItem}>
                  <Text className={styles.skylineTitle}>{item.title}</Text>
                  <Text className={styles.skylineDesc}>{item.desc}</Text>
                </View>
              </ListItem>
            ))}
          </ListView>
        </View>

        <LogConsole logs={logs} onClear={clear} />
      </View>
    </PageWrapper>
  );
}
