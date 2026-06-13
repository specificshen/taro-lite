import { View, Text, Slider } from '@spcsn/taro-components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { FormData, FormFieldErrors, ValueEvent } from '@/features/form-lab';
import styles from '../index.module.css';

interface BasicProfileCardProps {
  form: FormData;
  errors: FormFieldErrors;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

export function BasicProfileCard({ form, errors, updateField }: BasicProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基础资料</CardTitle>
        <CardDescription>覆盖 Input、Slider、Switch 与基础校验链路</CardDescription>
      </CardHeader>
      <CardContent>
        <View className={styles.field}>
          <Text className={styles.label}>姓名 *</Text>
          <Input placeholder="请输入姓名" value={form.name} onInput={(value) => updateField('name', value)} />
          {errors.name && <Text className={styles.error}>{errors.name}</Text>}
        </View>

        <View className={styles.field}>
          <Text className={styles.label}>邮箱 *</Text>
          <Input placeholder="请输入邮箱" value={form.email} onInput={(value) => updateField('email', value)} />
          {errors.email && <Text className={styles.error}>{errors.email}</Text>}
        </View>

        <View className={styles.field}>
          <Text className={styles.label}>手机号 *</Text>
          <Input placeholder="请输入手机号" value={form.phone} onInput={(value) => updateField('phone', value)} />
          {errors.phone && <Text className={styles.error}>{errors.phone}</Text>}
        </View>

        <View className={styles.field}>
          <Text className={styles.label}>年龄: {form.age}</Text>
          <Slider
            min={1}
            max={100}
            value={form.age}
            onChange={(event: ValueEvent<number>) => updateField('age', event.detail.value)}
          />
          {errors.age && <Text className={styles.error}>{errors.age}</Text>}
        </View>

        <View className={styles.field}>
          <Text className={styles.label}>验收预算: {form.budget} 小时</Text>
          <Slider
            min={4}
            max={80}
            step={2}
            value={form.budget}
            onChange={(event: ValueEvent<number>) => updateField('budget', event.detail.value)}
          />
        </View>
      </CardContent>
    </Card>
  );
}
