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
 *  SvgIcon — CSS-drawn geometric icons (zero-dependency)
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

interface SvgIconProps {
  name: SvgIconName;
  size?: number;
  color?: string;
  className?: string;
}

export function SvgIcon({ name, size = 20, color = 'currentColor', className }: SvgIconProps) {
  const style = { color, width: `${size}px`, height: `${size}px` } as React.CSSProperties;
  return (
    <View
      className={cn(styles.svgIcon, styles[`svgIcon_${name}`], className)}
      style={style}
    />
  );
}
