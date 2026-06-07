import { useState } from 'react';
import { View, Text, Slider, Switch, Textarea } from '@spcsn/taro-components';
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
  role: 'developer' | 'designer' | 'tester';
  plan: 'basic' | 'team' | 'enterprise';
  note: string;
}

const roleOptions: Array<{ value: FormData['role']; label: string; desc: string }> = [
  { value: 'developer', label: '开发', desc: '构建与调试' },
  { value: 'designer', label: '设计', desc: '样式与体验' },
  { value: 'tester', label: '测试', desc: '回归与验收' },
];

const planOptions: Array<{ value: FormData['plan']; label: string; desc: string }> = [
  { value: 'basic', label: '基础版', desc: '核心能力巡检' },
  { value: 'team', label: '团队版', desc: '多人协作验证' },
  { value: 'enterprise', label: '企业版', desc: '完整链路压测' },
];

export default function FormPage() {
  const { logs, add, clear } = useLogger();
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    age: 25,
    agree: false,
    gender: 'male',
    role: 'developer',
    plan: 'team',
    note: '',
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
    setForm({ name: '', email: '', age: 25, agree: false, gender: 'male', role: 'developer', plan: 'team', note: '' });
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

  const completedCount = [
    form.name,
    form.email,
    form.age > 0,
    form.gender,
    form.role,
    form.plan,
    form.note,
    form.agree,
  ].filter(Boolean).length;
  const completion = Math.round((completedCount / 8) * 100);

  return (
    <PageWrapper title="表单测试">
      <View className={`${styles.container} animate-fade-in-up`}>
        <View className={styles.formHero}>
          <View>
            <Text className={styles.formEyebrow}>Profile Setup</Text>
            <Text className={styles.formTitle}>用户资料配置</Text>
            <Text className={styles.formDesc}>验证输入、选择、滑动、开关、长文本和错误态的组合表现。</Text>
          </View>
          <View className={styles.progressBox}>
            <Text className={styles.progressValue}>{completion}%</Text>
            <Text className={styles.progressLabel}>完成度</Text>
          </View>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
            <CardDescription>请填写以下信息完成注册</CardDescription>
          </CardHeader>
          <CardContent>
            <View className={styles.field}>
              <Text className={styles.label}>姓名 *</Text>
              <Input placeholder="请输入姓名" value={form.name} onInput={(v) => updateField('name', v)} />
              {errors.name && <Text className={styles.error}>{errors.name}</Text>}
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>邮箱 *</Text>
              <Input placeholder="请输入邮箱" value={form.email} onInput={(v) => updateField('email', v)} />
              {errors.email && <Text className={styles.error}>{errors.email}</Text>}
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>年龄: {form.age}</Text>
              <Slider min={1} max={100} value={form.age} onChange={(e: any) => updateField('age', e.detail.value)} />
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
              <Text className={styles.label}>角色</Text>
              <View className={styles.optionGrid}>
                {roleOptions.map((item) => (
                  <View
                    key={item.value}
                    className={`${styles.optionCard} ${form.role === item.value ? styles.optionCardActive : ''}`}
                    onClick={() => updateField('role', item.value)}
                  >
                    <Text className={form.role === item.value ? styles.optionTitleActive : styles.optionTitle}>
                      {item.label}
                    </Text>
                    <Text className={form.role === item.value ? styles.optionDescActive : styles.optionDesc}>
                      {item.desc}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>方案</Text>
              <View className={styles.planList}>
                {planOptions.map((item, index) => (
                  <View
                    key={item.value}
                    className={`${styles.planRow} ${index > 0 ? styles.planRowSpaced : ''} ${form.plan === item.value ? styles.planRowActive : ''}`}
                    onClick={() => updateField('plan', item.value)}
                  >
                    <View>
                      <Text className={styles.planTitle}>{item.label}</Text>
                      <Text className={styles.planDesc}>{item.desc}</Text>
                    </View>
                    {form.plan === item.value && <Badge variant="success">已选</Badge>}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>备注</Text>
              <Textarea
                className={styles.noteArea}
                placeholder="记录端上验收备注..."
                value={form.note}
                onInput={(e: any) => updateField('note', e.detail.value)}
              />
            </View>

            <View className={styles.field}>
              <View className={styles.switchRow}>
                <Switch checked={form.agree} onChange={(e: any) => updateField('agree', e.detail.value)} />
                <Text className={styles.switchLabel}>我同意服务条款和隐私政策</Text>
              </View>
              {errors.agree && <Text className={styles.error}>{errors.agree}</Text>}
            </View>

            <Separator />

            <View className={styles.actions}>
              <Button onClick={handleSubmit}>提交表单</Button>
              <Button variant="secondary" onClick={handleReset}>
                重置
              </Button>
            </View>

            {submitted && (
              <View className={styles.result}>
                <Badge variant="success">提交成功</Badge>
                <Text className={styles.resultText}>{JSON.stringify(form, null, 2)}</Text>
              </View>
            )}
          </CardContent>
        </Card>

        <LogConsole logs={logs} onClear={clear} />
      </View>
    </PageWrapper>
  );
}
