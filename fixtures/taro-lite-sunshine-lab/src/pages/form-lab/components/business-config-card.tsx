import {
  View,
  Text,
  Switch,
  Textarea,
  Picker,
  CheckboxGroup,
  Checkbox,
  RadioGroup,
  Radio,
} from '@spcsn/taro-components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  channelOptions,
  genderOptions,
  planOptions,
  priorityOptions,
  roleOptions,
  teamSizeOptions,
} from '@/features/form-lab';
import type { FormData, FormFieldErrors, ValueEvent } from '@/features/form-lab';
import styles from '../index.module.css';

interface BusinessConfigCardProps {
  form: FormData;
  errors: FormFieldErrors;
  completion: number;
  selectedChannelLabels: string;
  selectedTeamIndex: number;
  submitted: boolean;
  onSubmit: () => void;
  onReset: () => void;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

export function BusinessConfigCard({
  form,
  errors,
  completion,
  selectedChannelLabels,
  selectedTeamIndex,
  submitted,
  onSubmit,
  onReset,
  updateField,
}: BusinessConfigCardProps) {
  const handleTeamSizeChange = (event: ValueEvent<string | number>) => {
    const index = Number(event.detail.value);
    updateField('teamSize', teamSizeOptions[index] ?? teamSizeOptions[0]);
  };

  return (
    <Card className={styles.sectionSpaced}>
      <CardHeader>
        <CardTitle>业务配置</CardTitle>
        <CardDescription>覆盖自定义分段选择、Picker、RadioGroup 与 CheckboxGroup</CardDescription>
      </CardHeader>
      <CardContent>
        <View className={styles.field}>
          <Text className={styles.label}>性别</Text>
          <View className={styles.radioGroup}>
            {genderOptions.map((item) => (
              <View
                key={item.value}
                className={`${styles.radioItem} ${form.gender === item.value ? styles.radioItemActive : ''}`}
                onClick={() => updateField('gender', item.value)}
              >
                <Text className={form.gender === item.value ? styles.radioTextActive : styles.radioText}>
                  {item.label}
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
          <Text className={styles.label}>团队规模</Text>
          <Picker mode="selector" range={teamSizeOptions} value={selectedTeamIndex} onChange={handleTeamSizeChange}>
            <View className={styles.pickerTrigger}>
              <Text className={styles.pickerValue}>{form.teamSize}</Text>
              <Text className={styles.pickerHint}>点击选择</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.field}>
          <Text className={styles.label}>验收日期</Text>
          <Picker
            mode="date"
            value={form.scheduleDate}
            onChange={(event: ValueEvent<string>) => updateField('scheduleDate', event.detail.value)}
          >
            <View className={styles.pickerTrigger}>
              <Text className={styles.pickerValue}>{form.scheduleDate}</Text>
              <Text className={styles.pickerHint}>选择日期</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.field}>
          <Text className={styles.label}>优先级</Text>
          <RadioGroup
            className={styles.nativeGroup}
            onChange={(event: ValueEvent<FormData['priority']>) => updateField('priority', event.detail.value)}
          >
            {priorityOptions.map((item, index) => (
              <View key={item.value} className={`${styles.nativeOption} ${index > 0 ? styles.nativeOptionSpaced : ''}`}>
                <Radio value={item.value} checked={form.priority === item.value} color="#2563eb" />
                <View className={styles.nativeOptionTextGroup}>
                  <Text className={styles.nativeOptionTitle}>{item.label}</Text>
                  <Text className={styles.nativeOptionDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </RadioGroup>
        </View>

        <View className={styles.field}>
          <Text className={styles.label}>通知渠道 *</Text>
          <CheckboxGroup
            className={styles.nativeGroup}
            onChange={(event: ValueEvent<string[]>) => updateField('channels', event.detail.value)}
          >
            {channelOptions.map((item, index) => (
              <View key={item.value} className={`${styles.nativeOption} ${index > 0 ? styles.nativeOptionSpaced : ''}`}>
                <Checkbox value={item.value} checked={form.channels.includes(item.value)} color="#2563eb" />
                <View className={styles.nativeOptionTextGroup}>
                  <Text className={styles.nativeOptionTitle}>{item.label}</Text>
                </View>
              </View>
            ))}
          </CheckboxGroup>
          {errors.channels && <Text className={styles.error}>{errors.channels}</Text>}
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
            onInput={(event: ValueEvent<string>) => updateField('note', event.detail.value)}
          />
          {errors.note && <Text className={styles.error}>{errors.note}</Text>}
        </View>

        <View className={styles.reviewPanel}>
          <View className={styles.reviewHeader}>
            <Text className={styles.reviewTitle}>实时摘要</Text>
            <Badge variant={completion === 100 ? 'success' : 'warning'}>{completion === 100 ? '完整' : '待完善'}</Badge>
          </View>
          <View className={styles.reviewGrid}>
            <View className={styles.reviewItem}>
              <Text className={styles.reviewLabel}>方案</Text>
              <Text className={styles.reviewValue}>{planOptions.find((item) => item.value === form.plan)?.label}</Text>
            </View>
            <View className={styles.reviewItem}>
              <Text className={styles.reviewLabel}>团队</Text>
              <Text className={styles.reviewValue}>{form.teamSize}</Text>
            </View>
            <View className={styles.reviewItem}>
              <Text className={styles.reviewLabel}>渠道</Text>
              <Text className={styles.reviewValue}>{selectedChannelLabels || '未选择'}</Text>
            </View>
            <View className={styles.reviewItem}>
              <Text className={styles.reviewLabel}>日期</Text>
              <Text className={styles.reviewValue}>{form.scheduleDate}</Text>
            </View>
          </View>
        </View>

        <View className={styles.field}>
          <View className={styles.switchRow}>
            <Switch
              checked={form.agree}
              onChange={(event: ValueEvent<boolean>) => updateField('agree', event.detail.value)}
            />
            <Text className={styles.switchLabel}>我同意服务条款和隐私政策</Text>
          </View>
          {errors.agree && <Text className={styles.error}>{errors.agree}</Text>}
        </View>

        <Separator />

        <View className={styles.actions}>
          <Button onClick={onSubmit}>提交表单</Button>
          <Button variant="secondary" onClick={onReset}>
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
  );
}
