import React from 'react';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export type IconName =
  // Navigation
  | 'home' | 'list' | 'target' | 'bot' | 'settings'
  // Actions
  | 'plus' | 'minus' | 'edit' | 'trash' | 'send' | 'search' | 'x' | 'chevron-right'
  | 'chevron-left' | 'arrow-left'
  // Finance
  | 'trending-down' | 'trending-up' | 'dollar-sign' | 'credit-card' | 'wallet'
  | 'pie-chart' | 'bar-chart' | 'activity'
  // Features
  | 'bell' | 'lock' | 'shield' | 'download' | 'share' | 'upload'
  | 'help-circle' | 'info' | 'star' | 'log-out' | 'eye' | 'eye-off'
  | 'calendar' | 'clock' | 'check-circle' | 'alert-triangle' | 'zap'
  // Categories
  | 'coffee' | 'truck' | 'shopping-bag' | 'film' | 'heart' | 'home-cat'
  | 'book-open' | 'package' | 'briefcase' | 'code' | 'gift' | 'refresh-cw'
  // App-specific
  | 'sprout' | 'fingerprint' | 'sparkles' | 'lightbulb' | 'message-circle'
  | 'user' | 'moon' | 'sun' | 'play' | 'flag';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

// Map our unified names to the correct icon library + name
const ICON_MAP: Record<IconName, { lib: 'feather' | 'mci' | 'ion'; icon: string }> = {
  // Navigation
  home: { lib: 'feather', icon: 'home' },
  list: { lib: 'feather', icon: 'list' },
  target: { lib: 'feather', icon: 'target' },
  bot: { lib: 'mci', icon: 'robot-outline' },
  settings: { lib: 'feather', icon: 'settings' },
  // Actions
  plus: { lib: 'feather', icon: 'plus' },
  minus: { lib: 'feather', icon: 'minus' },
  edit: { lib: 'feather', icon: 'edit-2' },
  trash: { lib: 'feather', icon: 'trash-2' },
  send: { lib: 'feather', icon: 'send' },
  search: { lib: 'feather', icon: 'search' },
  x: { lib: 'feather', icon: 'x' },
  'chevron-right': { lib: 'feather', icon: 'chevron-right' },
  'chevron-left': { lib: 'feather', icon: 'chevron-left' },
  'arrow-left': { lib: 'feather', icon: 'arrow-left' },
  // Finance
  'trending-down': { lib: 'feather', icon: 'trending-down' },
  'trending-up': { lib: 'feather', icon: 'trending-up' },
  'dollar-sign': { lib: 'feather', icon: 'dollar-sign' },
  'credit-card': { lib: 'feather', icon: 'credit-card' },
  wallet: { lib: 'mci', icon: 'wallet-outline' },
  'pie-chart': { lib: 'feather', icon: 'pie-chart' },
  'bar-chart': { lib: 'feather', icon: 'bar-chart-2' },
  activity: { lib: 'feather', icon: 'activity' },
  // Features
  bell: { lib: 'feather', icon: 'bell' },
  lock: { lib: 'feather', icon: 'lock' },
  shield: { lib: 'feather', icon: 'shield' },
  download: { lib: 'feather', icon: 'download' },
  share: { lib: 'feather', icon: 'share' },
  upload: { lib: 'feather', icon: 'upload' },
  'help-circle': { lib: 'feather', icon: 'help-circle' },
  info: { lib: 'feather', icon: 'info' },
  star: { lib: 'feather', icon: 'star' },
  'log-out': { lib: 'feather', icon: 'log-out' },
  eye: { lib: 'feather', icon: 'eye' },
  'eye-off': { lib: 'feather', icon: 'eye-off' },
  calendar: { lib: 'feather', icon: 'calendar' },
  clock: { lib: 'feather', icon: 'clock' },
  'check-circle': { lib: 'feather', icon: 'check-circle' },
  'alert-triangle': { lib: 'feather', icon: 'alert-triangle' },
  zap: { lib: 'feather', icon: 'zap' },
  // Categories
  coffee: { lib: 'feather', icon: 'coffee' },
  truck: { lib: 'feather', icon: 'truck' },
  'shopping-bag': { lib: 'feather', icon: 'shopping-bag' },
  film: { lib: 'feather', icon: 'film' },
  heart: { lib: 'feather', icon: 'heart' },
  'home-cat': { lib: 'feather', icon: 'home' },
  'book-open': { lib: 'feather', icon: 'book-open' },
  package: { lib: 'feather', icon: 'package' },
  briefcase: { lib: 'feather', icon: 'briefcase' },
  code: { lib: 'feather', icon: 'code' },
  gift: { lib: 'feather', icon: 'gift' },
  'refresh-cw': { lib: 'feather', icon: 'refresh-cw' },
  // App-specific
  sprout: { lib: 'mci', icon: 'sprout-outline' },
  fingerprint: { lib: 'mci', icon: 'fingerprint' },
  sparkles: { lib: 'mci', icon: 'creation' },
  lightbulb: { lib: 'mci', icon: 'lightbulb-outline' },
  'message-circle': { lib: 'feather', icon: 'message-circle' },
  user: { lib: 'feather', icon: 'user' },
  moon: { lib: 'feather', icon: 'moon' },
  sun: { lib: 'feather', icon: 'sun' },
  play: { lib: 'feather', icon: 'play' },
  flag: { lib: 'feather', icon: 'flag' },
};

export default function Icon({ name, size = 20, color = Colors.textPrimary }: IconProps) {
  const mapping = ICON_MAP[name];
  if (!mapping) return null;

  switch (mapping.lib) {
    case 'feather':
      return <Feather name={mapping.icon as any} size={size} color={color} />;
    case 'mci':
      return <MaterialCommunityIcons name={mapping.icon as any} size={size} color={color} />;
    case 'ion':
      return <Ionicons name={mapping.icon as any} size={size} color={color} />;
  }
}

// Category icon mapping for consistent use across the app
export const CATEGORY_ICONS: Record<string, { icon: IconName; color: string }> = {
  food: { icon: 'coffee', color: Colors.orange },
  transport: { icon: 'truck', color: Colors.accent },
  shopping: { icon: 'shopping-bag', color: Colors.danger },
  entertainment: { icon: 'film', color: Colors.purple },
  health: { icon: 'heart', color: Colors.primary },
  housing: { icon: 'home-cat', color: Colors.teal },
  education: { icon: 'book-open', color: Colors.teal },
  other: { icon: 'package', color: Colors.textMuted },
  salary: { icon: 'briefcase', color: Colors.primary },
  freelance: { icon: 'code', color: Colors.accent },
  investment: { icon: 'trending-up', color: Colors.purple },
  gift: { icon: 'gift', color: '#FF6B9D' },
  savings: { icon: 'target', color: Colors.primary },
};
