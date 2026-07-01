
export enum TimerMode {
  NORMAL = 'normal',
  DUPLET = 'duplet',
  BLITZ = 'blitz'
}

export interface ModeConfig {
  label: string;
  segments: number[];
  icon: string;
}

export interface ChGKQuestion {
  question: string;
  answer: string;
  author?: string;
  source?: string;
  explanation?: string;
}

export type SoundType = 'gong' | 'warning' | 'end' | 'tick';

export type VoiceType = 
  | '10s_left' 
  | 'time_up' 
  | 'count_1' 
  | 'count_2' 
  | 'count_3' 
  | 'count_4' 
  | 'count_5' 
  | 'count_6' 
  | 'count_7' 
  | 'count_8' 
  | 'count_9' 
  | 'count_10';

export type ThemeType = 'light' | 'dark' | 'system';

export interface AppSettings {
  useArrow: boolean;
  counterClockwise: boolean;
  signal10s: boolean;
  writingTime: boolean;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  hapticEnabled: boolean;
  theme: ThemeType;
}
