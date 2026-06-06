import { useState } from 'react';
import { View, Text, Slider, Switch } from '@spcsn/taro-components';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogConsole } from '@/components/demo/log-console';
import { useLogger } from '@/hooks/use-logger';
import styles from './index.module.css';

interface FormData {
  name: string;
  email: string;
  age: number;
  agree: boolean;
  gender: 'male' | 'female' | 'other';
}

export default function FormPage() {
  const { logs, add, clear } = useLogger();
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    age: 25,
    agree: false,
    gender: 'male',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) newErrors.name = '姓名不能为空';
    if (!form.email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    if (form.age < 1 || form.age > 120) newErrors.age = '年龄必须在 1-120 之间';
    if (!form.agree) newErrors.agree = '请同意服务条款';

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) add('表单验证失败', 'warn');
    return isValid;
  };

  const handleSubmit = () => {
    if (validate()) {
      setSubmitted(true);
      add(`表单提交成功: ${JSON.stringify(form)}`, 'success');
    }
  };

  const handleReset = () => {
    setForm({ name: '', email: '', age: 25, agree: false, gender: 'male' });
    setErrors({});
    setSubmitted(false);
    add('表单已重置', 'info');
  };

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setSubmitted(false);
  };

  return (
    <PageWrapper title="表单测试">
      <View className={styles.container}>
        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
            <CardDescription>请填写以下信息完成注册</CardDescription>
          </CardHeader>
          <CardContent>
            <View className={styles.field}>
              <Text className={styles.label}>姓名 *</Text>
              <Input
                placeholder="请输入姓名"
                value={form.name}
                onInput={(v) => updateField('name', v)}
              />
              {errors.name && <Text className={styles.error}>{errors.name}</Text>}
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>邮箱 *</Text>
              <Input
                placeholder="请输入邮箱"
                value={form.email}
                onInput={(v) => updateField('email', v)}
              />
              {errors.email && <Text className={styles.error}>{errors.email}</Text>}
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>年龄: {form.age}</Text>
              <Slider
                min={1}
                max={100}
                value={form.age}
                onChange={(e: any) => updateField('age', e.detail.value)}
              />
              {errors.age && <Text className={styles.error}>{errors.age}</Text>}
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>性别</Text>
              <View className={styles.radioGroup}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <View
                    key={g}
                    className={`${styles.radioItem} ${form.gender === g ? styles.radioItemActive : ''}`}
                    onClick={() => updateField('gender', g)}
                  >
                    <Text className={form.gender === g ? styles.radioTextActive : styles.radioText}>
                      {g === 'male' ? '男' : g === 'female' ? '女' : '其他'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.field}>
              <View className={styles.switchRow}>
                <Switch
                  checked={form.agree}
                  onChange={(e: any) => updateField('agree', e.detail.value)}
                />
                <Text className={styles.switchLabel}>我同意服务条款和隐私政策</Text>
              </View>
              {errors.agree && <Text className={styles.error}>{errors.agree}</Text>}
            </View>

            <Separator />

            <View className={styles.actions}>
              <Button onClick={handleSubmit}>提交表单</Button>
              <Button variant="secondary" onClick={handleReset}>重置</Button>
            </View>

            {submitted && (
              <View className={styles.result}>
                <Badge variant="success">提交成功</Badge>
                <Text className={styles.resultText}>
                  {JSON.stringify(form, null, 2)}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        <LogConsole logs={logs} onClear={clear} />
      </View>
    </PageWrapper>
  );
}
