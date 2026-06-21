import { Text, View } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './index.module.css';

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
  home: 'home',
  layers: 'U',
  form: 'F',
  list: 'L',
  wifi: 'N',
  hand: 'G',
  zap: 'S',
  settings: 'settings',
  'arrow-right': '->',
  'arrow-left': '<-',
  'chevron-right': '>',
  'chevron-left': '<',
  check: 'check',
  x: 'x',
  plus: '+',
  minus: '-',
  menu: 'menu',
  search: 'search',
  bell: 'bell',
  user: 'user',
  heart: 'heart',
  star: 'star',
  trash: 'trash',
  edit: 'edit',
  copy: 'copy',
  download: 'down',
  upload: 'up',
  refresh: 'refresh',
  spinner: 'loading',
  info: 'info',
  alert: 'alert',
  terminal: 'term',
  send: 'send',
  code: 'code',
  image: 'image',
  play: 'play',
  pause: 'pause',
  grid: 'grid',
  layout: 'layout',
  database: 'data',
  shield: 'shield',
  clock: 'clock',
  calendar: 'date',
  mail: 'mail',
  phone: 'phone',
  map: 'map',
  sun: 'sun',
  moon: 'moon',
  eye: 'eye',
  'eye-off': 'hide',
  lock: 'lock',
  unlock: 'unlock',
  filter: 'filter',
  sort: 'sort',
  more: 'more',
  expand: 'expand',
  collapse: 'collapse',
};

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Icon({ name, size = 'md', className }: IconProps) {
  return <Text className={cn(styles.icon, styles[`icon_${size}`], className)}>{iconMap[name] || name}</Text>;
}

export type IconCircleGradient =
  | 'primary'
  | 'warm'
  | 'ocean'
  | 'rose'
  | 'sky'
  | 'dark'
  | 'success'
  | 'warning'
  | 'violet';

interface IconCircleProps {
  name: IconName;
  gradient?: IconCircleGradient;
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

function Stroke({ style }: { style: Record<string, string | number> }) {
  return <View style={style} />;
}

function SvgShape({ name, size, color }: { name: SvgIconName; size: number; color: string }) {
  const stroke = Math.max(2, size * 0.1);
  const box = { width: size, height: size, position: 'relative' as const };
  const line = { position: 'absolute' as const, backgroundColor: color, borderRadius: 1 };

  if (name === 'arrow-left' || name === 'chevron-left') {
    return (
      <View style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: size * 0.48,
            height: size * 0.48,
            borderLeft: `${stroke}px solid ${color}`,
            borderBottom: `${stroke}px solid ${color}`,
            transform: 'rotate(45deg)',
          }}
        />
      </View>
    );
  }

  if (name === 'arrow-right' || name === 'chevron-right') {
    return (
      <View style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: size * 0.48,
            height: size * 0.48,
            borderRight: `${stroke}px solid ${color}`,
            borderTop: `${stroke}px solid ${color}`,
            transform: 'rotate(45deg)',
          }}
        />
      </View>
    );
  }

  if (name === 'chevron-up' || name === 'chevron-down') {
    const borders =
      name === 'chevron-up'
        ? { borderLeft: `${stroke}px solid ${color}`, borderTop: `${stroke}px solid ${color}` }
        : { borderRight: `${stroke}px solid ${color}`, borderBottom: `${stroke}px solid ${color}` };
    return (
      <View style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size * 0.48, height: size * 0.48, ...borders, transform: 'rotate(45deg)' }} />
      </View>
    );
  }

  if (name === 'x') {
    return (
      <View style={box}>
        <Stroke
          style={{
            ...line,
            width: '70%',
            height: stroke,
            top: '50%',
            left: '15%',
            marginTop: -stroke / 2,
            transform: 'rotate(45deg)',
          }}
        />
        <Stroke
          style={{
            ...line,
            width: '70%',
            height: stroke,
            top: '50%',
            left: '15%',
            marginTop: -stroke / 2,
            transform: 'rotate(-45deg)',
          }}
        />
      </View>
    );
  }

  if (name === 'check') {
    return (
      <View style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: size * 0.28,
            height: size * 0.55,
            borderRight: `${stroke}px solid ${color}`,
            borderBottom: `${stroke}px solid ${color}`,
            transform: 'rotate(45deg)',
          }}
        />
      </View>
    );
  }

  if (name === 'plus') {
    return (
      <View style={box}>
        <Stroke style={{ ...line, width: '60%', height: stroke, top: '50%', left: '20%', marginTop: -stroke / 2 }} />
        <Stroke style={{ ...line, width: stroke, height: '60%', top: '20%', left: '50%', marginLeft: -stroke / 2 }} />
      </View>
    );
  }

  if (name === 'minus') {
    return (
      <View style={box}>
        <Stroke style={{ ...line, width: '60%', height: stroke, top: '50%', left: '20%', marginTop: -stroke / 2 }} />
      </View>
    );
  }

  if (name === 'menu') {
    const top = (size - 2 * size * 0.22 - stroke) / 2;
    return (
      <View style={box}>
        <Stroke style={{ ...line, width: '60%', height: stroke, top, left: '20%' }} />
        <Stroke style={{ ...line, width: '60%', height: stroke, top: top + size * 0.22, left: '20%' }} />
        <Stroke style={{ ...line, width: '60%', height: stroke, top: top + 2 * size * 0.22, left: '20%' }} />
      </View>
    );
  }

  const dot = Math.max(2, size * 0.1);
  return (
    <View style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: dot, height: dot, borderRadius: 9999, backgroundColor: color }} />
      <View style={{ width: dot, height: dot, borderRadius: 9999, backgroundColor: color, marginLeft: size * 0.2 }} />
      <View style={{ width: dot, height: dot, borderRadius: 9999, backgroundColor: color, marginLeft: size * 0.2 }} />
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
  return (
    <View className={className} style={{ display: 'inline-flex', flexShrink: 0 }}>
      <SvgShape name={name} size={size} color={color} />
    </View>
  );
}
