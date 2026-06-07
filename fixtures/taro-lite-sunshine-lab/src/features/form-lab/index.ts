export interface FormData {
  name: string;
  email: string;
  phone: string;
  age: number;
  budget: number;
  agree: boolean;
  gender: 'male' | 'female' | 'other';
  role: 'developer' | 'designer' | 'tester';
  plan: 'basic' | 'team' | 'enterprise';
  teamSize: string;
  scheduleDate: string;
  priority: 'low' | 'medium' | 'high';
  channels: string[];
  note: string;
}

export interface ValueEvent<T> {
  detail: {
    value: T;
  };
}

export type FormFieldErrors = Partial<Record<keyof FormData, string>>;

export const genderOptions: Array<{ value: FormData['gender']; label: string }> = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
];

export const roleOptions: Array<{ value: FormData['role']; label: string; desc: string }> = [
  { value: 'developer', label: '开发', desc: '构建与调试' },
  { value: 'designer', label: '设计', desc: '样式与体验' },
  { value: 'tester', label: '测试', desc: '回归与验收' },
];

export const planOptions: Array<{ value: FormData['plan']; label: string; desc: string }> = [
  { value: 'basic', label: '基础版', desc: '核心能力巡检' },
  { value: 'team', label: '团队版', desc: '多人协作验证' },
  { value: 'enterprise', label: '企业版', desc: '完整链路压测' },
];

export const teamSizeOptions = ['1-5 人', '6-20 人', '21-80 人', '80+ 人'];

export const channelOptions = [
  { value: 'email', label: '邮件' },
  { value: 'message', label: '站内信' },
  { value: 'webhook', label: 'Webhook' },
];

export const priorityOptions: Array<{ value: FormData['priority']; label: string; desc: string }> = [
  { value: 'low', label: '低', desc: '常规巡检' },
  { value: 'medium', label: '中', desc: '发布前验证' },
  { value: 'high', label: '高', desc: '阻塞问题' },
];

export function createInitialForm(): FormData {
  return {
    name: '',
    email: '',
    phone: '',
    age: 25,
    budget: 30,
    agree: false,
    gender: 'male',
    role: 'developer',
    plan: 'team',
    teamSize: teamSizeOptions[1],
    scheduleDate: '2026-06-07',
    priority: 'medium',
    channels: ['email'],
    note: '',
  };
}

export function validateForm(form: FormData): FormFieldErrors {
  const errors: FormFieldErrors = {};
  if (!form.name.trim()) errors.name = '姓名不能为空';
  if (!form.email.trim()) {
    errors.email = '邮箱不能为空';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '邮箱格式不正确';
  }
  if (!/^1\d{10}$/.test(form.phone)) errors.phone = '请输入 11 位手机号';
  if (form.age < 1 || form.age > 120) errors.age = '年龄必须在 1-120 之间';
  if (form.channels.length === 0) errors.channels = '至少选择一种通知渠道';
  if (!form.note.trim()) errors.note = '请填写验收备注';
  if (!form.agree) errors.agree = '请同意服务条款';
  return errors;
}

export function getFormCompletion(form: FormData): number {
  const completedCount = [
    form.name,
    form.email,
    form.phone,
    form.age > 0,
    form.budget > 0,
    form.gender,
    form.role,
    form.plan,
    form.teamSize,
    form.scheduleDate,
    form.priority,
    form.channels.length > 0,
    form.note,
    form.agree,
  ].filter(Boolean).length;
  return Math.round((completedCount / 14) * 100);
}

export function getSelectedChannelLabels(channels: string[]): string {
  return channelOptions
    .filter((item) => channels.includes(item.value))
    .map((item) => item.label)
    .join('、');
}
