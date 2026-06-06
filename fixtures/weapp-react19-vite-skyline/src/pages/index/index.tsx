import { useState, useTransition, useEffect, useRef } from 'react';
import Taro, { useLoad, useReady, useDidShow, useDidHide } from '@spcsn/taro';
import {
  View,
  Text,
  Button,
  ScrollView,
  Input,
  Slider,
  ListView,
  ListItem,
  TapGestureHandler,
  PanGestureHandler,
} from '@spcsn/taro-components';
import styles from './index.module.css';

interface MessageLog {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

declare const wx: any;

function Index() {
  // Custom Navbar Header states
  const [statusBarHeight, setStatusBarHeight] = useState(20);
  const [navBarHeight, setNavBarHeight] = useState(44);

  // General App states
  const [activeTab, setActiveTab] = useState<'react19' | 'skyline' | 'taroApi'>('react19');
  const [logs, setLogs] = useState<MessageLog[]>([]);

  // Tab 1: React 19 Action & Batching
  const [username, setUsername] = useState('Samuel');
  const [age, setAge] = useState(25);
  const [isSubmitPending, startSubmitTransition] = useTransition();
  const [submitResult, setSubmitResult] = useState('');

  // Tab 2: Skyline and Gestures
  const [scrollItems, setScrollItems] = useState<number[]>([]);
  const gestureStatus = '等待手势操作...';

  // Tab 3: Request / Interceptor Simulation
  const [requestUrl, setRequestUrl] = useState('https://api.spcsn.com/v1/user');
  const [requestResult, setRequestResult] = useState('');
  const interceptorRegistered = useRef(false);

  // Write log helper
  const addLog = (text: string, type: MessageLog['type'] = 'info') => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    setLogs((prev) => [{ id: Math.random().toString(36), time: timeStr, text, type }, ...prev.slice(0, 19)]);
  };

  // Safe area & navigation calculation
  useEffect(() => {
    try {
      const windowInfo = (Taro as any).getWindowInfo ? (Taro as any).getWindowInfo() : Taro.getSystemInfoSync();
      setStatusBarHeight(windowInfo.statusBarHeight || 20);
      
      // Calculate based on capsule, standard default is 44 or custom
      let menuButtonInfo = { bottom: 58, top: 24, height: 32 };
      if (typeof wx !== 'undefined' && wx.getMenuButtonBoundingClientRect) {
        try {
          menuButtonInfo = wx.getMenuButtonBoundingClientRect();
        } catch (e) {
          // ignore
        }
      }
      const calcNavBarHeight = (menuButtonInfo.top - windowInfo.statusBarHeight) * 2 + menuButtonInfo.height;
      setNavBarHeight(calcNavBarHeight || 44);
      addLog(`获取系统信息：屏幕宽度 = ${windowInfo.screenWidth}px, Skyline 渲染引擎`, 'info');
    } catch (err) {
      addLog(`获取系统/胶囊信息失败: ${err instanceof Error ? err.message : err}`, 'warn');
    }
  }, []);

  // Taro Lifecycles hooks verification
  useLoad((options) => {
    addLog(`useLoad 触发: 页面参数 = ${JSON.stringify(options)}`, 'info');
    // Populate heavy scroll data for Skyline performance test
    const mockData = Array.from({ length: 15 }, (_, i) => i + 1);
    setScrollItems(mockData);
  });

  useReady(() => {
    addLog('useReady 触发: 页面首次渲染完成', 'success');
  });

  useDidShow(() => {
    addLog('useShow / useDidShow 触发: 页面显示', 'info');
  });

  useDidHide(() => {
    addLog('useHide / useDidHide 触发: 页面隐藏', 'info');
  });

  // Action / Transition demo (React 19)
  const handleUpdateProfile = () => {
    startSubmitTransition(async () => {
      addLog(`React 19 Action/Transition 开始提交数据...`, 'info');
      
      // Artificial delay demonstrating loading/concurrent rendering
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setSubmitResult(`更新成功！姓名：${username}，年龄：${age} (${new Date().toLocaleTimeString()})`);
      addLog(`React 19 Action 完成，已更新资料!`, 'success');
    });
  };

  // Mock Request with Taro Interceptors
  const triggerSimulatedRequest = async () => {
    if (!interceptorRegistered.current) {
      interceptorRegistered.current = true;
      try {
        if (typeof Taro.addInterceptor === 'function') {
          // Register a custom client-side debug interceptor showing chaining
          Taro.addInterceptor((chain) => {
            const params = chain.requestParams;
            addLog(`[拦截器] 拦截到请求: ${params.url}`, 'info');
            
            // Custom response interceptor mapping
            return chain.proceed(params).then((res) => {
              addLog(`[拦截器] 解析到响应，状态码: ${res.statusCode}`, 'success');
              return res;
            }).catch((err) => {
              addLog(`[拦截器] 捕获网络错误: ${err.message || err}`, 'error');
              throw err;
            });
          });
          addLog('全局 Taro.addInterceptor 拦截器注册成功！', 'success');
        }
      } catch (err) {
        addLog(`拦截器初始化异常: ${err instanceof Error ? err.message : err}`, 'warn');
      }
    }

    addLog(`发送请求到 ${requestUrl}...`, 'info');
    setRequestResult('正在加载数据...');

    // Since we are mocking inside the local network/WeChat environment:
    try {
      if (typeof Taro.request === 'function') {
        const response = await Taro.request({
          url: requestUrl,
          method: 'GET',
          // Set a fake header to verify custom requests
          header: { 'X-Taro-Lite-Sandbox': 'true' },
        });
        setRequestResult(JSON.stringify(response.data || response, null, 2));
        addLog(`请求成功！返回字段长度: ${JSON.stringify(response.data).length}`, 'success');
      } else {
        // Mock fallback if native Taro.request is run in non-weapp node env
        const fakeData = { id: 1001, name: username, source: 'intercepted-mock-sandbox', timestamp: Date.now() };
        setRequestResult(JSON.stringify(fakeData, null, 2));
        addLog(`环境未支持 Taro.request，采用沙盒 Mock 数据成功`, 'success');
      }
    } catch (err: any) {
      setRequestResult(`请求失败: ${err.message || JSON.stringify(err)}`);
      addLog(`请求过程抛出异常`, 'error');
    }
  };

  return (
    <View className={styles.appContainer}>
      {/* 1. Custom Safe Area Custom Navigation Bar */}
      <View 
        className={styles.navbar} 
        style={{ 
          paddingTop: `${statusBarHeight}px`, 
          height: `${navBarHeight}px` 
        }}
      >
        <View className={styles.navbarTitleArea}>
          <Text className={styles.navbarTitle}>Taro Lite Sandbox</Text>
        </View>
      </View>

      {/* Main Container scrolled separately to fully match Skyline-scroll capability layout */}
      <ScrollView 
        bounces 
        scrollY 
        className={styles.scrollBody}
        style={{ top: `${statusBarHeight + navBarHeight}px` }}
      >
        <View className={styles.banner}>
          <Text className={styles.bannerTitle}>SPCSN Taro Lite</Text>
          <Text className={styles.bannerSub}>React 19 + Vite (Skyline & glass-easel) 校验环境</Text>
        </View>

        {/* 2. Responsive Dashboard Tab Controls */}
        <View className={styles.tabBar}>
          <View 
            className={`${styles.tabItem} ${activeTab === 'react19' ? styles.tabActive : ''}`} 
            onClick={() => setActiveTab('react19')}
          >
            <Text className={styles.tabText}>React 19 特性</Text>
          </View>
          <View 
            className={`${styles.tabItem} ${activeTab === 'skyline' ? styles.tabActive : ''}`} 
            onClick={() => setActiveTab('skyline')}
          >
            <Text className={styles.tabText}>Skyline 渲染</Text>
          </View>
          <View 
            className={`${styles.tabItem} ${activeTab === 'taroApi' ? styles.tabActive : ''}`} 
            onClick={() => setActiveTab('taroApi')}
          >
            <Text className={styles.tabText}>防抖与拦截器</Text>
          </View>
        </View>

        {/* 3. Panel Views */}
        {activeTab === 'react19' && (
          <View className={styles.panel}>
            <View className={styles.panelHeader}>
              <Text className={styles.panelTitle}>React 19 Actions & 并发更新</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>名字</Text>
              <Input 
                className={styles.textInput} 
                value={username} 
                onInput={(e: any) => setUsername(e.detail.value)} 
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>年龄: {age}</Text>
              <Slider 
                className={styles.slider} 
                min={1} 
                max={100} 
                value={age} 
                onChange={(e: any) => setAge(e.detail.value)} 
              />
            </View>

            <Button 
              className={styles.actionButton} 
              disabled={isSubmitPending}
              onClick={handleUpdateProfile}
            >
              {isSubmitPending ? '正在提交中 (useTransition)...' : '使用 React 19 Action 提交'}
            </Button>

            {submitResult && (
              <View className={styles.resultBox}>
                <Text className={styles.resultText}>{submitResult}</Text>
              </View>
            )}

            <View className={styles.tipsArea}>
              <Text className={styles.tipsText}>
                ⚠️ 小贴士：React 19 的 useTransition 可以极好的配合小程序的异步渲染，在保持 UI 丝滑的同时展示 pending 加载态。
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'skyline' && (
          <View className={styles.panel}>
            <View className={styles.panelHeader}>
              <Text className={styles.panelTitle}>Skyline 高性能组件 & 物理手势</Text>
            </View>

            {/* Skyline Native Gesture Interactive Card */}
            <Text className={styles.sectionSubTitle}>物理交互感应区 (Gestures)</Text>
            
            {/* Gesture wrappers map dynamically to WeChat Mini Program engine */}
            <TapGestureHandler onGestureWorklet="onTap">
              <PanGestureHandler onGestureWorklet="onPan">
                <View className={styles.gestureCard}>
                  <Text className={styles.gestureCardTitle}>手势触控板</Text>
                  <Text className={styles.gestureCardDoc}>物理节点支持原生手势，通过 Worklet 绑定减少交互延迟</Text>
                  <View className={styles.gestureCardStatus}>
                    <Text className={styles.gestureStatusText}>{gestureStatus}</Text>
                  </View>
                </View>
              </PanGestureHandler>
            </TapGestureHandler>

            {/* Skyline ListView Grid Representation */}
            <Text className={styles.sectionSubTitle}>高帧率卡片瀑布流 (ListView)</Text>
            <ListView className={styles.listViewContainer}>
              {scrollItems.map((item) => (
                <ListItem className={styles.listItem} key={item}>
                  <View className={styles.listCard}>
                    <View className={styles.listCardBadge}>
                      <Text className={styles.listCardBadgeText}>高性能 #{item}</Text>
                    </View>
                    <Text className={styles.listCardText}>开启 Skyline 渲染的子节点</Text>
                  </View>
                </ListItem>
              ))}
            </ListView>
          </View>
        )}

        {activeTab === 'taroApi' && (
          <View className={styles.panel}>
            <View className={styles.panelHeader}>
              <Text className={styles.panelTitle}>Taro 拦截器机制 & 原生桥接</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>沙盒请求地址:</Text>
              <Input 
                className={styles.textInput} 
                value={requestUrl} 
                onInput={(e: any) => setRequestUrl(e.detail.value)} 
              />
            </View>

            <Button className={styles.apiButton} onClick={triggerSimulatedRequest}>
              发起 Taro.request 请求
            </Button>

            {requestResult ? (
              <View className={styles.requestResultBox}>
                <Text className={styles.responseLabel}>响应数据 (拦截处理后):</Text>
                <ScrollView scrollY className={styles.jsonScroll}>
                  <Text className={styles.jsonText}>{requestResult}</Text>
                </ScrollView>
              </View>
            ) : (
              <View className={styles.requestPlaceholder}>
                <Text className={styles.placeholderText}>点击上方按钮，可以验证经过拦截器注册过滤后的响应效果</Text>
              </View>
            )}

            <Button 
              className={styles.secondaryButton} 
              onClick={() => {
                try {
                  Taro.showToast({
                    title: 'Taro 提示框调试',
                    icon: 'success',
                    duration: 1500
                  });
                  addLog('Taro.showToast 触发', 'success');
                } catch(e) {
                  addLog('Taro.showToast 原生环境不支持', 'warn');
                }
              }}
            >
              模拟 Toast 原生消息提醒
            </Button>
          </View>
        )}

        {/* 4. Logger Terminal Logs Display (Excellent debug utility) */}
        <View className={styles.logSection}>
          <View className={styles.logHeader}>
            <Text className={styles.logModuleTitle}>运行日志台 (Logs)</Text>
            <Text className={styles.clearLogButton} onClick={() => setLogs([])}>清空</Text>
          </View>

          <View className={styles.logConsole}>
            {logs.length === 0 ? (
              <View className={styles.logLineEmpty}>
                <Text className={styles.logMessageEmpty}>暂无打印，交互页面上方的控件将打印生命周期和调试报告</Text>
              </View>
            ) : (
              logs.map((log) => (
                <View className={styles.logLine} key={log.id}>
                  <Text className={styles.logTime}>[{log.time}]</Text>
                  <Text className={`${styles.logMessage} ${styles[`logType_${log.type}`]}`}>
                    {log.text}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default Index;
