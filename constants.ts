import { TimerMode, ModeConfig } from './types';

export const MODE_CONFIGS: Record<TimerMode, ModeConfig> = {
  [TimerMode.NORMAL]: {
    label: 'Oddiy',
    segments: [60],
    icon: 'fa-solid fa-circle'
  },
  [TimerMode.DUPLET]: {
    label: 'Duplet',
    segments: [30, 30],
    icon: 'fa-solid fa-circle-half-stroke'
  },
  [TimerMode.BLITZ]: {
    label: 'Blits',
    segments: [20, 20, 20],
    icon: 'fa-solid fa-circle-nodes'
  }
};

export const COLORS = {
  bg: '#f0f4f8',
  text: '#2c3e50',
  accent: '#10254E',
  danger: '#e63946',
  shadowLight: '#ffffff',
  shadowDark: '#d1d9e6'
};