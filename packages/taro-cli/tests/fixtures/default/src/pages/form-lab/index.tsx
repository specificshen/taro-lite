import { useState } from 'react';
import { View } from '@spcsn/taro-components';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { LogConsole } from '@/components/demo/log-console';
import {
  createInitialForm,
  getFormCompletion,
  getSelectedChannelLabels,
  teamSizeOptions,
  validateForm,
} from '@/features/form-lab';
import type { FormData, FormFieldErrors } from '@/features/form-lab';
import { useLogger } from '@/hooks/use-logger';
import { BasicProfileCard } from './components/basic-profile-card';
import { BusinessConfigCard } from './components/business-config-card';
import { FormHero } from './components/form-hero';
import { FormStatusGrid } from './components/form-status-grid';
import styles from './index.module.css';

export default function FormPage() {
  const { logs, add, clear } = useLogger();
  const [form, setForm] = useState<FormData>(() => createInitialForm());
  const [errors, setErrors] = useState<FormFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const newErrors = validateForm(form);
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
    setForm(createInitialForm());
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

  const completion = getFormCompletion(form);
  const selectedTeamIndex = Math.max(0, teamSizeOptions.indexOf(form.teamSize));
  const selectedChannelLabels = getSelectedChannelLabels(form.channels);
  const invalidCount = Object.keys(errors).length;

  return (
    <PageWrapper title="表单测试">
      <View className={`${styles.container} animate-fade-in-up`}>
        <FormHero completion={completion} />
        <FormStatusGrid invalidCount={invalidCount} channelCount={form.channels.length} budget={form.budget} />
        <BasicProfileCard form={form} errors={errors} updateField={updateField} />
        <BusinessConfigCard
          form={form}
          errors={errors}
          completion={completion}
          selectedChannelLabels={selectedChannelLabels}
          selectedTeamIndex={selectedTeamIndex}
          submitted={submitted}
          onSubmit={handleSubmit}
          onReset={handleReset}
          updateField={updateField}
        />
        <LogConsole logs={logs} onClear={clear} />
      </View>
    </PageWrapper>
  );
}
