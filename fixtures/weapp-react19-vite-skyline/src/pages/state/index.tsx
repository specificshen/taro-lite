import { useState, useTransition, useReducer, useCallback, createContext, useContext } from 'react';
import { View, Text, Input as TaroInput } from '@spcsn/taro-components';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogConsole } from '@/components/demo/log-console';
import { useLogger } from '@/hooks/use-logger';
import { sleep } from '@/lib/utils';
import styles from './index.module.css';

/* =========================================================
 *  1. Context + Reducer 计数器
 * ========================================================= */
interface CounterState {
  count: number;
  history: number[];
}

type CounterAction =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }
  | { type: 'batch'; payload: number };

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1, history: [state.count + 1, ...state.history].slice(0, 10) };
    case 'decrement':
      return { count: state.count - 1, history: [state.count - 1, ...state.history].slice(0, 10) };
    case 'reset':
      return { count: 0, history: [] };
    case 'batch':
      return { count: action.payload, history: [action.payload, ...state.history].slice(0, 10) };
    default:
      return state;
  }
}

const CounterContext = createContext<{
  state: CounterState;
  dispatch: React.Dispatch<CounterAction>;
} | null>(null);

function useCounter() {
  const ctx = useContext(CounterContext);
  if (!ctx) throw new Error('useCounter must be inside CounterProvider');
  return ctx;
}

function CounterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(counterReducer, { count: 0, history: [] });
  return (
    <CounterContext.Provider value={{ state, dispatch }}>
      {children}
    </CounterContext.Provider>
  );
}

function CounterDisplay() {
  const { state } = useCounter();
  return (
    <View className={styles.counterDisplay}>
      <Text className={styles.counterNumber}>{state.count}</Text>
      <View className={styles.historyRow}>
        {state.history.slice(0, 5).map((h, i) => (
          <Badge key={i} variant="outline">{h}</Badge>
        ))}
      </View>
    </View>
  );
}

function CounterControls() {
  const { dispatch } = useCounter();
  return (
    <View className={styles.counterControls}>
      <Button size="sm" onClick={() => dispatch({ type: 'decrement' })}>-1</Button>
      <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'reset' })}>重置</Button>
      <Button size="sm" onClick={() => dispatch({ type: 'increment' })}>+1</Button>
    </View>
  );
}

/* =========================================================
 *  2. Page Component
 * ========================================================= */
export default function StatePage() {
  const { logs, add, clear } = useLogger();

  // --- useTransition Demo ---
  const [name, setName] = useState('');
  const [list, setList] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      add('useTransition: 开始生成大量数据...', 'info');
      await sleep(800);
      const newList = Array.from({ length: 200 }, (_, i) => `${name || 'Item'} #${i + 1}`);
      setList(newList);
      add('useTransition: 数据生成完成 (200条)', 'success');
    });
  }, [name, add]);

  // --- Batched Updates Demo ---
  const [batchedValues, setBatchedValues] = useState({ a: 0, b: 0, c: 0 });
  const handleBatchUpdate = useCallback(() => {
    add('批量更新: 同时更新 a, b, c', 'info');
    setBatchedValues({
      a: Math.floor(Math.random() * 100),
      b: Math.floor(Math.random() * 100),
      c: Math.floor(Math.random() * 100),
    });
    add('批量更新完成', 'success');
  }, [add]);

  return (
    <PageWrapper title="状态测试">
      <View className={styles.container}>
        {/* Transition Section */}
        <Card>
          <CardHeader>
            <CardTitle>useTransition 并发更新</CardTitle>
            <CardDescription>React 19 并发特性，大数据渲染不阻塞 UI</CardDescription>
          </CardHeader>
          <CardContent>
            <View className={styles.field}>
              <Text className={styles.label}>前缀名称</Text>
              <View className={styles.inputRow}>
                <TaroInput
                  className={styles.textInput}
                  placeholder="输入前缀..."
                  value={name}
                  onInput={(e: any) => setName(e.detail.value)}
                />
                <Button disabled={isPending} onClick={handleGenerate}>
                  {isPending ? '生成中...' : '生成 200 条'}
                </Button>
              </View>
            </View>
            {list.length > 0 && (
              <View className={styles.listPreview}>
                <Text className={styles.listCount}>已生成 {list.length} 项</Text>
                <View className={styles.tagCloud}>
                  {list.slice(0, 20).map((item, i) => (
                    <Badge key={i} variant="secondary">{item}</Badge>
                  ))}
                  {list.length > 20 && (
                    <Badge variant="outline">+{list.length - 20} more</Badge>
                  )}
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Reducer + Context Section */}
        <Card>
          <CardHeader>
            <CardTitle>useReducer + Context</CardTitle>
            <CardDescription>跨组件状态共享与复杂状态逻辑</CardDescription>
          </CardHeader>
          <CardContent>
            <CounterProvider>
              <CounterDisplay />
              <CounterControls />
            </CounterProvider>
          </CardContent>
        </Card>

        {/* Batch Update Section */}
        <Card>
          <CardHeader>
            <CardTitle>批量状态更新</CardTitle>
            <CardDescription>单次 setState 同时更新多个字段</CardDescription>
          </CardHeader>
          <CardContent>
            <View className={styles.batchGrid}>
              <View className={styles.batchItem}>
                <Text className={styles.batchLabel}>A</Text>
                <Text className={styles.batchValue}>{batchedValues.a}</Text>
              </View>
              <View className={styles.batchItem}>
                <Text className={styles.batchLabel}>B</Text>
                <Text className={styles.batchValue}>{batchedValues.b}</Text>
              </View>
              <View className={styles.batchItem}>
                <Text className={styles.batchLabel}>C</Text>
                <Text className={styles.batchValue}>{batchedValues.c}</Text>
              </View>
            </View>
            <Button onClick={handleBatchUpdate}>随机批量更新</Button>
          </CardContent>
        </Card>

        <LogConsole logs={logs} onClear={clear} />
      </View>
    </PageWrapper>
  );
}
