import { Canvas, Image, Text, View } from '@spcsn/taro-components';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './index.module.css';

const SAMPLE_IMAGE = 'https://picsum.photos/seed/taro-lite/400/300';

export default function MediaPage() {
  return (
    <PageWrapper title="媒体测试">
      <View className={styles.container}>
        <View className={styles.labHero}>
          <Text className={styles.labEyebrow}>Media Lab</Text>
          <Text className={styles.labTitle}>媒体组件</Text>
          <Text className={styles.labDesc}>Image / Canvas 渲染与样式兼容性验证</Text>
        </View>

        <Card className={styles.section}>
          <CardHeader>
            <CardTitle>Image 组件</CardTitle>
          </CardHeader>
          <CardContent>
            <View className={styles.imageWrap}>
              <Image className={styles.sampleImage} src={SAMPLE_IMAGE} mode="aspectFill" lazyLoad showMenuByLongpress />
            </View>
            <Text className={styles.caption}>aspectFill · lazyLoad · showMenuByLongpress</Text>
          </CardContent>
        </Card>

        <Card className={styles.section}>
          <CardHeader>
            <CardTitle>Canvas 组件</CardTitle>
          </CardHeader>
          <CardContent>
            <Canvas className={styles.sampleCanvas} type="2d" id="media-canvas" />
            <Text className={styles.caption}>type=2d · 用于绘制图形与动画</Text>
          </CardContent>
        </Card>
      </View>
    </PageWrapper>
  );
}
