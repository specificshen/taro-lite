import { View, Text } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './ui.module.css';

export type IconName =
  | 'home'
  | 'layers'
  | 'form'
  | 'list'
  | 'wifi'
  | 'hand'
  | 'zap'
  | 'settings'
  | 'arrow-right'
  | 'arrow-left'
  | 'chevron-right'
  | 'chevron-left'
  | 'check'
  | 'x'
  | 'plus'
  | 'minus'
  | 'menu'
  | 'search'
  | 'bell'
  | 'user'
  | 'heart'
  | 'star'
  | 'trash'
  | 'edit'
  | 'copy'
  | 'download'
  | 'upload'
  | 'refresh'
  | 'spinner'
  | 'info'
  | 'alert'
  | 'terminal'
  | 'send'
  | 'code'
  | 'image'
  | 'play'
  | 'pause'
  | 'grid'
  | 'layout'
  | 'database'
  | 'shield'
  | 'clock'
  | 'calendar'
  | 'mail'
  | 'phone'
  | 'map'
  | 'sun'
  | 'moon'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'unlock'
  | 'filter'
  | 'sort'
  | 'more'
  | 'expand'
  | 'collapse';

const iconMap: Record<IconName, string> = {
  home: '🏠',
  layers: '📚',
  form: '📝',
  list: '📋',
  wifi: '📡',
  hand: '👆',
  zap: '⚡',
  settings: '⚙️',
  'arrow-right': '→',
  'arrow-left': '←',
  'chevron-right': '›',
  'chevron-left': '‹',
  check: '✓',
  x: '✕',
  plus: '+',
  minus: '−',
  menu: '☰',
  search: '🔍',
  bell: '🔔',
  user: '👤',
  heart: '♥',
  star: '★',
  trash: '🗑',
  edit: '✎',
  copy: '⎘',
  download: '↓',
  upload: '↑',
  refresh: '↻',
  spinner: '◌',
  info: 'ⓘ',
  alert: '⚠',
  terminal: '❯',
  send: '➤',
  code: '</>',
  image: '🖼',
  play: '▶',
  pause: '⏸',
  grid: '⊞',
  layout: '▦',
  database: '🗄',
  shield: '🛡',
  clock: '◷',
  calendar: '📅',
  mail: '✉',
  phone: '📞',
  map: '🗺',
  sun: '☀',
  moon: '☾',
  eye: '👁',
  'eye-off': '🚫',
  lock: '🔒',
  unlock: '🔓',
  filter: '⫧',
  sort: '⇅',
  more: '⋯',
  expand: '⤢',
  collapse: '⤡',
};

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Icon({ name, size = 'md', className }: IconProps) {
  return (
    <Text className={cn(styles.icon, styles[`icon_${size}`], className)}>
      {iconMap[name] || name}
    </Text>
  );
}

interface IconCircleProps {
  name: IconName;
  gradient?: 'primary' | 'warm' | 'ocean' | 'rose' | 'sky' | 'dark' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconCircle({ name, gradient = 'primary', size = 'md', className }: IconCircleProps) {
  return (
    <View className={cn(styles.iconCircle, styles[`iconCircle_${size}`], styles[`iconCircle_${gradient}`], className)}>
      <Icon name={name} size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} />
    </View>
  );
}

/* =========================================================
 *  SvgIcon — View-composed geometric icons (Skyline-safe)
 * ========================================================= */
export type SvgIconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'x'
  | 'check'
  | 'plus'
  | 'minus'
  | 'menu'
  | 'more';

function ArrowLeft({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.1);
  return (
    <View style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: s * 0.5, height: s * 0.5, borderLeft: `${w}px solid ${c}`, borderBottom: `${w}px solid ${c}`, transform: 'rotate(45deg)' }} />
    </View>
  );
}

function ArrowRight({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.1);
  return (
    <View style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: s * 0.5, height: s * 0.5, borderRight: `${w}px solid ${c}`, borderTop: `${w}px solid ${c}`, transform: 'rotate(45deg)' }} />
    </View>
  );
}

function ChevronLeft({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.1);
  return (
    <View style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: s * 0.45, height: s * 0.45, borderLeft: `${w}px solid ${c}`, borderBottom: `${w}px solid ${c}`, transform: 'rotate(45deg)' }} />
    </View>
  );
}

function ChevronRight({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.1);
  return (
    <View style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: s * 0.45, height: s * 0.45, borderRight: `${w}px solid ${c}`, borderTop: `${w}px solid ${c}`, transform: 'rotate(45deg)' }} />
    </View>
  );
}

function ChevronUp({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.1);
  return (
    <View style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: s * 0.45, height: s * 0.45, borderLeft: `${w}px solid ${c}`, borderTop: `${w}px solid ${c}`, transform: 'rotate(45deg)' }} />
    </View>
  );
}

function ChevronDown({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.1);
  return (
    <View style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: s * 0.45, height: s * 0.45, borderRight: `${w}px solid ${c}`, borderBottom: `${w}px solid ${c}`, transform: 'rotate(45deg)' }} />
    </View>
  );
}

function XIcon({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.1);
  return (
    <View style={{ width: s, height: s, position: 'relative' }}>
      <View style={{ position: 'absolute', width: '70%', height: w, backgroundColor: c, top: '50%', left: '15%', marginTop: -w / 2, transform: 'rotate(45deg)' }} />
      <View style={{ position: 'absolute', width: '70%', height: w, backgroundColor: c, top: '50%', left: '15%', marginTop: -w / 2, transform: 'rotate(-45deg)' }} />
    </View>
  );
}

function CheckIcon({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.12);
  return (
    <View style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: s * 0.28, height: s * 0.55, borderRight: `${w}px solid ${c}`, borderBottom: `${w}px solid ${c}`, transform: 'rotate(45deg)' }} />
    </View>
  );
}

function PlusIcon({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.1);
  return (
    <View style={{ width: s, height: s, position: 'relative' }}>
      <View style={{ position: 'absolute', width: '60%', height: w, backgroundColor: c, top: '50%', left: '20%', marginTop: -w / 2 }} />
      <View style={{ position: 'absolute', width: w, height: '60%', backgroundColor: c, top: '20%', left: '50%', marginLeft: -w / 2 }} />
    </View>
  );
}

function MinusIcon({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.1);
  return (
    <View style={{ width: s, height: s, position: 'relative' }}>
      <View style={{ position: 'absolute', width: '60%', height: w, backgroundColor: c, top: '50%', left: '20%', marginTop: -w / 2 }} />
    </View>
  );
}

function MenuIcon({ s, c }: { s: number; c: string }) {
  const w = Math.max(2, s * 0.1);
  const gap = s * 0.22;
  const top = (s - 2 * gap - w) / 2;
  return (
    <View style={{ width: s, height: s, position: 'relative' }}>
      <View style={{ position: 'absolute', width: '60%', height: w, backgroundColor: c, top, left: '20%' }} />
      <View style={{ position: 'absolute', width: '60%', height: w, backgroundColor: c, top: top + gap, left: '20%' }} />
      <View style={{ position: 'absolute', width: '60%', height: w, backgroundColor: c, top: top + 2 * gap, left: '20%' }} />
    </View>
  );
}

function MoreIcon({ s, c }: { s: number; c: string }) {
  const r = Math.max(2, s * 0.1);
  return (
    <View style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: r, height: r, borderRadius: 9999, backgroundColor: c }} />
      <View style={{ width: r, height: r, borderRadius: 9999, backgroundColor: c, marginLeft: s * 0.2 }} />
      <View style={{ width: r, height: r, borderRadius: 9999, backgroundColor: c, marginLeft: s * 0.2 }} />
    </View>
  );
}

interface SvgIconProps {
  name: SvgIconName;
  size?: number;
  color?: string;
  className?: string;
}

export function SvgIcon({ name, size = 20, color = 'currentColor', className }: SvgIconProps) {
  const s = size;
  const c = color;

  const iconMap: Record<SvgIconName, React.ReactNode> = {
    'arrow-left': <ArrowLeft s={s} c={c} />,
    'arrow-right': <ArrowRight s={s} c={c} />,
    'chevron-left': <ChevronLeft s={s} c={c} />,
    'chevron-right': <ChevronRight s={s} c={c} />,
    'chevron-up': <ChevronUp s={s} c={c} />,
    'chevron-down': <ChevronDown s={s} c={c} />,
    x: <XIcon s={s} c={c} />,
    check: <CheckIcon s={s} c={c} />,
    plus: <PlusIcon s={s} c={c} />,
    minus: <MinusIcon s={s} c={c} />,
    menu: <MenuIcon s={s} c={c} />,
    more: <MoreIcon s={s} c={c} />,
  };

  return (
    <View className={className} style={{ display: 'inline-flex', flexShrink: 0 }}>
      {iconMap[name]}
    </View>
  );
}
