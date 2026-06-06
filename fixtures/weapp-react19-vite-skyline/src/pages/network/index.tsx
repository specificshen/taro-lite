import { useState, useRef } from 'react';
import { View, Text, ScrollView } from '@spcsn/taro-components';
import Taro from '@spcsn/taro';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LogConsole } from '@/components/demo/log-console';
import { useLogger } from '@/hooks/use-logger';
import { sleep } from '@/lib/utils';
import styles from './index.module.css';

export default function NetworkPage() {
  const { logs, add, clear } = useLogger();
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [response, setResponse] = useState('');
  const [latency, setLatency] = useState(0);
  const interceptorRegistered = useRef(false);

  const registerInterceptor = () => {
    if (interceptorRegistered.current) return;
    interceptorRegistered.current = true;

    try {
      if (typeof Taro.addInterceptor === 'function') {
        Taro.addInterceptor((chain) => {
          const params = chain.requestParams;
          add(`[拦截器] 请求: ${params.method || 'GET'} ${params.url}`, 'info');
          return chain.proceed(params).then((res) => {
            add(`[拦截器] 响应: ${res.statusCode}`, 'success');
            return res;
          }).catch((err) => {
            add(`[拦截器] 错误: ${err.message || err}`, 'error');
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
        add(`Mock 请求完成，耗时 ${ms}ms`, 'success');
      }
    } catch (err: any) {
      const ms = Date.now() - start;
      setLatency(ms);
      setResponse(`请求失败: ${err.message || JSON.stringify(err)}`);
      add(`请求失败，耗时 ${ms}ms`, 'error');
    }
  };

  const doErrorRequest = async () => {
    registerInterceptor();
    setResponse('');
    setLatency(0);
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
        add(`收到 HTTP ${res.statusCode}`, 'warn');
      } else {
        await sleep(400);
        const ms = Date.now() - start;
        setLatency(ms);
        setResponse('Mock 404: Not Found');
        add('Mock 404 响应', 'warn');
      }
    } catch (err: any) {
      const ms = Date.now() - start;
      setLatency(ms);
      setResponse(`异常: ${err.message || JSON.stringify(err)}`);
      add(`异常捕获: ${err.message || err}`, 'error');
    }
  };

  return (
    <PageWrapper title="网络测试">
      <View className={styles.container}>
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
              <Button variant="destructive" onClick={doErrorRequest}>模拟错误</Button>
              <Button variant="secondary" onClick={() => {
                setResponse('');
                setLatency(0);
                add('响应已清空', 'info');
              }}>
                清空响应
              </Button>
            </View>
          </CardContent>
        </Card>

        {response && (
          <Card>
            <CardHeader>
              <View className={styles.resHeader}>
                <CardTitle>响应结果</CardTitle>
                {latency > 0 && <Badge variant="secondary">{latency}ms</Badge>}
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
