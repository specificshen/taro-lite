import Taro from '@spcsn/taro';
import { ScrollView, Text, View } from '@spcsn/taro-components';
import { useRef, useState } from 'react';
import { LogConsole } from '@/components/demo/log-console';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLogger } from '@/hooks/use-logger';
import { sleep } from '@/lib/utils';
import styles from './index.module.css';

const requestPresets = [
  { label: '文章详情', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' as const },
  { label: '创建记录', url: 'https://jsonplaceholder.typicode.com/posts', method: 'POST' as const },
  { label: '错误链路', url: 'https://httpbin.org/status/404', method: 'GET' as const },
];

export default function NetworkPage() {
  const { logs, add, clear } = useLogger();
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [response, setResponse] = useState('');
  const [latency, setLatency] = useState(0);
  const [lastStatus, setLastStatus] = useState<'idle' | 'success' | 'warn' | 'error'>('idle');
  const interceptorRegistered = useRef(false);

  const applyPreset = (preset: (typeof requestPresets)[number]) => {
    setUrl(preset.url);
    setMethod(preset.method);
    setResponse('');
    setLatency(0);
    setLastStatus('idle');
    add(`已切换预设: ${preset.label}`, 'info');
  };

  const registerInterceptor = () => {
    if (interceptorRegistered.current) return;
    interceptorRegistered.current = true;

    try {
      if (typeof Taro.addInterceptor === 'function') {
        Taro.addInterceptor((chain) => {
          const params = chain.requestParams;
          add(`[拦截器] 请求: ${params.method || 'GET'} ${params.url}`, 'info');
          return chain
            .proceed(params)
            .then((res: { statusCode?: number }) => {
              add(`[拦截器] 响应: ${res.statusCode}`, 'success');
              return res;
            })
            .catch((err: unknown) => {
              add(`[拦截器] 错误: ${err instanceof Error ? err.message : String(err)}`, 'error');
              throw err;
            });
        });
        add('拦截器注册成功', 'success');
      }
    } catch (err) {
      add(`拦截器注册失败: ${err instanceof Error ? err.message : err}`, 'warn');
    }
  };

  const doRequest = async () => {
    registerInterceptor();
    setResponse('');
    setLatency(0);
    setLastStatus('idle');
    const start = Date.now();
    add(`发起 ${method} 请求: ${url}`, 'info');

    try {
      if (typeof Taro.request === 'function') {
        const res = await Taro.request({
          url,
          method,
          header: { 'X-Taro-Lite-Fixture': 'true' },
          data: method === 'POST' ? { title: 'Taro Lite', body: 'Fixture test' } : undefined,
        });
        const ms = Date.now() - start;
        setLatency(ms);
        setResponse(JSON.stringify(res.data, null, 2));
        setLastStatus('success');
        add(`请求成功，耗时 ${ms}ms`, 'success');
      } else {
        await sleep(600);
        const ms = Date.now() - start;
        setLatency(ms);
        const mock = {
          id: 1,
          title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
          body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto',
          userId: 1,
          _mock: true,
          _latency: `${ms}ms`,
        };
        setResponse(JSON.stringify(mock, null, 2));
        setLastStatus('success');
        add(`Mock 请求完成，耗时 ${ms}ms`, 'success');
      }
    } catch (err: any) {
      const ms = Date.now() - start;
      setLatency(ms);
      setResponse(`请求失败: ${err.message || JSON.stringify(err)}`);
      setLastStatus('error');
      add(`请求失败，耗时 ${ms}ms`, 'error');
    }
  };

  const doErrorRequest = async () => {
    registerInterceptor();
    setResponse('');
    setLatency(0);
    setLastStatus('idle');
    const start = Date.now();
    add('发起错误请求...', 'info');

    try {
      if (typeof Taro.request === 'function') {
        const res = await Taro.request({
          url: 'https://httpbin.org/status/404',
          method: 'GET',
        });
        const ms = Date.now() - start;
        setLatency(ms);
        setResponse(JSON.stringify({ statusCode: res.statusCode, data: res.data }, null, 2));
        setLastStatus('warn');
        add(`收到 HTTP ${res.statusCode}`, 'warn');
      } else {
        await sleep(400);
        const ms = Date.now() - start;
        setLatency(ms);
        setResponse('Mock 404: Not Found');
        setLastStatus('warn');
        add('Mock 404 响应', 'warn');
      }
    } catch (err: any) {
      const ms = Date.now() - start;
      setLatency(ms);
      setResponse(`异常: ${err.message || JSON.stringify(err)}`);
      setLastStatus('error');
      add(`异常捕获: ${err.message || err}`, 'error');
    }
  };

  return (
    <PageWrapper title="网络测试">
      <View className={`${styles.container} animate-fade-in-up`}>
        <View className={styles.netHero}>
          <Text className={styles.heroTitle}>网络链路工作台</Text>
          <Text className={styles.heroDesc}>覆盖请求配置、拦截器、成功响应、错误态和日志观测。</Text>
          <View className={styles.statusRow}>
            <View className={styles.statusPill}>
              <Text className={styles.statusLabel}>Interceptor</Text>
              <Text className={styles.statusValue}>{interceptorRegistered.current ? 'ON' : 'READY'}</Text>
            </View>
            <View className={styles.statusPill}>
              <Text className={styles.statusLabel}>Latency</Text>
              <Text className={styles.statusValue}>{latency ? `${latency}ms` : '--'}</Text>
            </View>
            <View className={styles.statusPill}>
              <Text className={styles.statusLabel}>State</Text>
              <Text className={styles.statusValue}>{lastStatus}</Text>
            </View>
          </View>
        </View>

        <View className={styles.presetGrid}>
          {requestPresets.map((preset) => (
            <View key={preset.label} className={styles.presetCard} onClick={() => applyPreset(preset)}>
              <Text className={styles.presetLabel}>{preset.label}</Text>
              <Text className={styles.presetMethod}>{preset.method}</Text>
            </View>
          ))}
        </View>

        <Card>
          <CardHeader>
            <CardTitle>请求配置</CardTitle>
          </CardHeader>
          <CardContent>
            <View className={styles.field}>
              <Text className={styles.label}>请求地址</Text>
              <Input value={url} onInput={setUrl} />
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>请求方法</Text>
              <View className={styles.methodGroup}>
                {(['GET', 'POST'] as const).map((m) => (
                  <View
                    key={m}
                    className={`${styles.methodItem} ${method === m ? styles.methodItemActive : ''}`}
                    onClick={() => setMethod(m)}
                  >
                    <Text className={method === m ? styles.methodTextActive : styles.methodText}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.actions}>
              <Button onClick={doRequest}>发送请求</Button>
              <Button variant="destructive" onClick={doErrorRequest}>
                模拟错误
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setResponse('');
                  setLatency(0);
                  setLastStatus('idle');
                  add('响应已清空', 'info');
                }}
              >
                清空响应
              </Button>
            </View>
          </CardContent>
        </Card>

        {response && (
          <Card className={styles.responseCard}>
            <CardHeader>
              <View className={styles.resHeader}>
                <CardTitle>响应结果</CardTitle>
                <View className={styles.responseBadges}>
                  {latency > 0 && <Badge variant="secondary">{latency}ms</Badge>}
                  <Badge
                    variant={lastStatus === 'success' ? 'success' : lastStatus === 'error' ? 'destructive' : 'warning'}
                  >
                    {lastStatus}
                  </Badge>
                </View>
              </View>
            </CardHeader>
            <CardContent>
              <ScrollView scrollY className={styles.jsonScroll}>
                <Text className={styles.jsonText}>{response}</Text>
              </ScrollView>
            </CardContent>
          </Card>
        )}

        <LogConsole logs={logs} onClear={clear} />
      </View>
    </PageWrapper>
  );
}
