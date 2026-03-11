# Zakovat Taymeri - To'liq Loyiha Kodi

Ushbu fayl loyihadagi barcha asosiy kodlarni o'z ichiga oladi. Loyihani qayta tiklash uchun har bir bo'limdagi kodni tegishli fayl nomiga saqlang.

## 1. /types.ts
```typescript
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
  theme: ThemeType;
  aiTrainingEnabled: boolean;
}
```

## 2. /constants.ts
```typescript
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
```

## 3. /services/audio.ts
```typescript
import { SoundType, VoiceType } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public voiceEnabled: boolean = false;

  private voiceFiles: Record<VoiceType, string> = {
    '10s_left': 'input_file_1.mp3',
    'time_up': 'input_file_2.mp3',
    'count_1': 'input_file_3.mp3',
    'count_2': 'input_file_4.mp3',
    'count_3': 'input_file_5.mp3',
    'count_4': 'input_file_6.mp3',
    'count_5': 'input_file_7.mp3',
    'count_6': 'input_file_8.mp3',
    'count_7': 'input_file_9.mp3',
    'count_8': 'input_file_10.mp3',
    'count_9': 'input_file_11.mp3',
    'count_10': 'input_file_12.mp3',
  };

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playSound(type: SoundType) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const createOscillator = (freq: number, type: OscillatorType, startTime: number, duration: number, volume: number) => {
      const osc = this.ctx!.createOscillator();
      const gainNode = this.ctx!.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx!.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    switch (type) {
      case 'gong':
        createOscillator(1200, 'square', now, 0.25, 0.3);
        break;
      case 'warning':
        createOscillator(1500, 'square', now, 0.12, 0.3);
        createOscillator(1500, 'square', now + 0.2, 0.12, 0.3);
        createOscillator(1500, 'square', now + 0.4, 0.12, 0.3);
        break;
      case 'tick':
        createOscillator(1000, 'square', now, 0.08, 0.25);
        break;
      case 'end':
        createOscillator(600, 'square', now, 1.0, 0.4);
        break;
    }
  }

  public playVoice(type: VoiceType) {
    if (!this.voiceEnabled) return;
    const audio = new Audio(this.voiceFiles[type]);
    audio.play().catch(e => console.error("Audio playback failed", e));
  }
}

export const audioService = new AudioService();
```

## 4. /services/gemini.ts
```typescript
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ChGKQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateChGKQuestion = async (): Promise<ChGKQuestion> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: "Generate a professional-level 'What? Where? When?' (ChGK) intellectual game question in Uzbek. It should be challenging, logical, and have a clear answer. Include the question, correct answer, and a brief logical explanation.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
          explanation: { type: Type.STRING },
          author: { type: Type.STRING }
        },
        required: ["question", "answer", "explanation"]
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Failed to generate question");
  }
};

export const speakText = async (text: string): Promise<void> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly in Uzbek: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from Gemini TTS");
  }

  return new Promise(async (resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioToBuffer(audioBytes, audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => { resolve(); };
      source.start();
    } catch (e) {
      console.error("Audio playback error:", e);
      reject(e);
    }
  });
};

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioToBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const numSamples = Math.floor(data.byteLength / 2);
  const dataInt16 = new Int16Array(data.buffer, 0, numSamples);
  const frameCount = numSamples / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
```

## 5. /components/CircularTimer.tsx
```typescript
import React from 'react';
import { TimerMode } from '../types';
import { MODE_CONFIGS } from '../constants';

interface CircularTimerProps {
  currentTime: number;
  totalTime: number;
  statusText: string;
  mode: TimerMode;
  segmentIndex: number;
  isWritingPhase?: boolean;
  onReset?: () => void;
  useArrow?: boolean;
  counterClockwise?: boolean;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ 
  currentTime, 
  totalTime, 
  statusText,
  mode,
  segmentIndex,
  isWritingPhase,
  onReset,
  useArrow,
  counterClockwise
}) => {
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const config = MODE_CONFIGS[mode];
  const globalTotal = isWritingPhase ? 10 : config.segments.reduce((a, b) => a + b, 0);
  const futureSegmentsTime = isWritingPhase ? 0 : config.segments.slice(segmentIndex + 1).reduce((a, b) => a + b, 0);
  const globalRemaining = isWritingPhase ? currentTime : futureSegmentsTime + currentTime;
  const globalElapsed = globalTotal - globalRemaining;
  const progress = (globalRemaining / globalTotal) * 100;
  const offset = circumference - (progress / 100) * circumference;

  let timerColor = 'var(--accent-color)';
  if (isWritingPhase) {
    timerColor = 'var(--danger-color)';
  } else if (globalRemaining <= 10 && globalRemaining > 0) {
    timerColor = '#eab308';
  }

  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6) - 90;
      const rad = (angle * Math.PI) / 180;
      let isSeparator = false;
      if (mode === TimerMode.DUPLET && (i === 0 || i === 30)) isSeparator = true;
      if (mode === TimerMode.BLITZ && (i === 0 || i === 20 || i === 40)) isSeparator = true;
      if (mode === TimerMode.NORMAL && i === 0) isSeparator = true;
      const innerR = radius + (isSeparator ? 8 : 12);
      const outerR = radius + 22;
      const x1 = 150 + innerR * Math.cos(rad);
      const y1 = 150 + innerR * Math.sin(rad);
      const x2 = 150 + outerR * Math.cos(rad);
      const y2 = 150 + outerR * Math.sin(rad);
      ticks.push(
        <line 
          key={i} 
          x1={x1} y1={y1} x2={x2} y2={y2} 
          style={{ 
            stroke: isSeparator ? timerColor : '#cbd5e1', 
            strokeWidth: isSeparator ? 3 : 1.5,
            opacity: isSeparator ? 1 : 0.6
          }} 
        />
      );
    }
    return ticks;
  };

  const getArrowAngle = () => {
    const p = globalRemaining / globalTotal;
    return counterClockwise ? (p * 360) - 90 : ((1 - p) * 360) - 90;
  };

  const arrowAngle = getArrowAngle();
  const radArrow = (arrowAngle * Math.PI) / 180;
  const arrowLength = radius - 10; 
  const arrowX = 150 + arrowLength * Math.cos(radArrow);
  const arrowY = 150 + arrowLength * Math.sin(radArrow);
  const displayTime = counterClockwise ? globalRemaining : globalElapsed;

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center my-8 transition-all duration-500">
      <svg className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none" viewBox="0 0 300 300">
        {renderTicks()}
        <circle
          className="progress-ring__circle"
          stroke={timerColor}
          strokeWidth="5"
          fill="transparent"
          r={radius}
          cx="150"
          cy="150"
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: offset,
            opacity: 0.8,
            transform: counterClockwise ? 'rotate(-90deg)' : 'scaleX(-1) rotate(-90deg)',
            transformOrigin: '50% 50%'
          }}
        />
        {useArrow && (
          <>
            <line x1="150" y1="150" x2={arrowX} y2={arrowY} stroke={timerColor} strokeWidth="5" strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
            <circle cx="150" cy="150" r="6" fill={timerColor} />
            <circle cx="150" cy="150" r="2" fill="white" />
          </>
        )}
      </svg>
      <div className="w-60 h-60 md:w-72 md:h-72 rounded-full neumorphic-convex flex flex-col items-center justify-center z-10 relative">
        {!useArrow && (
          <span className="text-7xl md:text-8xl font-bold tabular-nums transition-colors duration-300" style={{ color: timerColor }}>
            {displayTime < 10 && displayTime > 0 ? `${displayTime}` : displayTime}
          </span>
        )}
      </div>
    </div>
  );
};

export default CircularTimer;
```

## 6. /components/QuestionPanel.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { generateChGKQuestion, speakText } from '../services/gemini';
import { ChGKQuestion } from '../types';

const QuestionPanel: React.FC = () => {
  const [question, setQuestion] = useState<ChGKQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchQuestion = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setShowAnswer(false);
    try {
      const q = await generateChGKQuestion();
      setQuestion(q);
    } catch (err) {
      alert("Savol yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (isTyping) return;
      if (e.key.toLowerCase() === 'n') fetchQuestion();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchQuestion]);

  const handleSpeak = async () => {
    if (!question || isSpeaking) return;
    setIsSpeaking(true);
    try {
      await speakText(question.question);
    } catch (err) {
      console.error("TTS error:", err);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="w-full p-6 rounded-3xl neumorphic-flat lg:min-h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-700">AI Mashg‘ulot</h2>
        <div className="flex gap-3">
          {question && !loading && (
            <button onClick={handleSpeak} disabled={isSpeaking} className="w-10 h-10 rounded-full neumorphic-flat neumorphic-active text-[#10254E] flex items-center justify-center disabled:opacity-50 transition-all">
              <i className={`fa-solid ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-high'}`}></i>
            </button>
          )}
          <button onClick={fetchQuestion} disabled={loading} className="px-6 py-2 rounded-full neumorphic-flat neumorphic-active text-[#10254E] font-semibold disabled:opacity-50">
            {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>}
            Savol yaratish
          </button>
        </div>
      </div>
      {!question && !loading && <p className="text-center text-gray-400 py-8 italic">O‘zingizni sinab ko‘rish uchun Gemini AI orqali savol yarating</p>}
      {loading && (
        <div className="flex flex-col items-center py-12">
          <div className="w-12 h-12 border-4 border-[#10254E] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Mantiqiy savol tayyorlanmoqda...</p>
        </div>
      )}
      {question && !loading && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-2xl neumorphic-inset bg-gray-50/30">
            <p className="text-lg text-gray-800 leading-relaxed font-medium">{question.question}</p>
          </div>
          {showAnswer && (
            <div className="space-y-4 animate-slideUp">
              <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                <p className="text-sm font-bold text-green-700 uppercase mb-1">Javob:</p>
                <p className="text-lg font-bold text-gray-800">{question.answer}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#10254E]/5 border border-[#10254E]/20">
                <p className="text-sm font-bold text-[#10254E] uppercase mb-1">Izoh:</p>
                <p className="text-gray-700 leading-relaxed">{question.explanation}</p>
              </div>
            </div>
          )}
          <button onClick={() => setShowAnswer(!showAnswer)} className="w-full py-3 rounded-xl neumorphic-flat neumorphic-active text-gray-600 font-bold tracking-wider">
            {showAnswer ? 'JAVOBNI BERKITISH' : 'JAVOBNI KO‘RISH'}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionPanel;
```

## 7. /components/SettingsDrawer.tsx
```typescript
import React from 'react';
import { AppSettings, ThemeType } from '../types';

interface SettingsDrawerProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ settings, updateSettings, isOpen, onClose }) => {
  if (!isOpen) return null;

  const SettingRow = ({ label, description, active, onClick }: { label: string, description?: string, active: boolean, onClick: () => void }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-200/50 last:border-0">
      <div className="flex-1 pr-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{label}</h3>
        {description && <p className="text-xs text-gray-400 mt-1 leading-tight">{description}</p>}
      </div>
      <div onClick={onClick} className={`toggle-switch ${active ? 'toggle-active' : 'toggle-inactive'}`}></div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fadeIn" onClick={onClose}></div>
      <div className="relative w-full max-w-sm h-full neumorphic-flat p-6 overflow-y-auto animate-slideLeft flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-700">Sozlamalar</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl neumorphic-flat neumorphic-active flex items-center justify-center text-gray-500"><i className="fa-solid fa-times"></i></button>
        </div>
        <div className="space-y-4 flex-1">
          <section className="mb-8">
            <h4 className="text-[10px] font-black text-[#10254E] uppercase tracking-[0.2em] mb-4">1. Siferblat</h4>
            <SettingRow label="Strelkali rejim" description="Raqamlar o‘rniga soat milini ko‘rsatish" active={settings.useArrow} onClick={() => updateSettings({ useArrow: !settings.useArrow })} />
            <SettingRow label="Teskari sanash" description="Soat miliga teskari sanashni yoqish" active={settings.counterClockwise} onClick={() => updateSettings({ counterClockwise: !settings.counterClockwise })} />
          </section>
          <section className="mb-8">
            <h4 className="text-[10px] font-black text-[#10254E] uppercase tracking-[0.2em] mb-4">2. Vaqtni sanash</h4>
            <SettingRow label="10 soniya signali" description="Vaqt tugashiga 10s qolganda signal berish" active={settings.signal10s} onClick={() => updateSettings({ signal10s: !settings.signal10s })} />
            <SettingRow label="Javobni yozish vaqti" description="Asosiy vaqtdan so‘ng 10 soniya qo‘shish" active={settings.writingTime} onClick={() => updateSettings({ writingTime: !settings.writingTime })} />
          </section>
          <section className="mb-8">
            <h4 className="text-[10px] font-black text-[#10254E] uppercase tracking-[0.2em] mb-4">3. Bildirishnomalar</h4>
            <SettingRow label="Signal" description="Taymerning standart elektron signallari" active={settings.soundEnabled} onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })} />
            <SettingRow label="Inson ovozi" description="Ovozli ogohlantirishlar va teskari sanash" active={settings.voiceEnabled} onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })} />
          </section>
          <section className="mb-8">
            <h4 className="text-[10px] font-black text-[#10254E] uppercase tracking-[0.2em] mb-4">4. AI Mashg‘ulot</h4>
            <SettingRow label="AI Mashg‘ulot" description="Savol yaratish panelini yoqish/o‘chirish" active={settings.aiTrainingEnabled} onClick={() => updateSettings({ aiTrainingEnabled: !settings.aiTrainingEnabled })} />
          </section>
          <section className="mb-8">
            <h4 className="text-[10px] font-black text-[#10254E] uppercase tracking-[0.2em] mb-4">5. Ranglar mavzusi</h4>
            <div className="grid grid-cols-3 gap-3">
              {(['light', 'dark', 'system'] as ThemeType[]).map((t) => (
                <button key={t} onClick={() => updateSettings({ theme: t })} className={`py-3 rounded-xl neumorphic-flat text-[10px] font-bold uppercase transition-all ${settings.theme === t ? 'active-mode' : 'text-gray-400'}`}>
                  {t === 'light' ? 'Yorug‘' : t === 'dark' ? 'Qorong‘u' : 'Auto'}
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="pt-6 text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">Zakovat taymeri v2.0</div>
      </div>
    </div>
  );
};

export default SettingsDrawer;
```

## 8. /App.tsx
```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react';
import CircularTimer from './components/CircularTimer';
import QuestionPanel from './components/QuestionPanel';
import SettingsDrawer from './components/SettingsDrawer';
import { TimerMode, AppSettings, VoiceType } from './types';
import { MODE_CONFIGS } from './constants';
import { audioService } from './services/audio';

const App: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.NORMAL);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(MODE_CONFIGS[TimerMode.NORMAL].segments[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [isWritingPhase, setIsWritingPhase] = useState(false);
  const [statusText, setStatusText] = useState('Tayyor');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<AppSettings>({
    useArrow: false,
    counterClockwise: true,
    signal10s: true,
    writingTime: true,
    soundEnabled: true,
    voiceEnabled: false,
    theme: 'light',
    aiTrainingEnabled: false
  });

  const timerRef = useRef<any>(null);

  const updateStatusLabel = useCallback((m: TimerMode, idx: number, isWriting = false) => {
    if (isWriting) { setStatusText('Vaqt! (Yozish)'); return; }
    if (m === TimerMode.NORMAL) setStatusText('Savol');
    else if (m === TimerMode.DUPLET) setStatusText(`Duplet ${idx + 1}/2`);
    else if (m === TimerMode.BLITZ) setStatusText(`Blits ${idx + 1}/3`);
  }, []);

  const resetTimer = useCallback((newMode?: TimerMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const targetMode = newMode || mode;
    setIsRunning(false);
    setIsWritingPhase(false);
    setSegmentIndex(0);
    setCurrentTime(MODE_CONFIGS[targetMode].segments[0]);
    updateStatusLabel(targetMode, 0);
  }, [mode, updateStatusLabel]);

  const handleModeChange = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    resetTimer(newMode);
  }, [resetTimer]);

  const handleEndSegment = useCallback(() => {
    const config = MODE_CONFIGS[mode];
    const isLastSegment = segmentIndex >= config.segments.length - 1;
    setIsRunning(false);
    if (settings.soundEnabled) audioService.playSound('end');
    if (settings.voiceEnabled) audioService.playVoice('time_up');
    if (isLastSegment) {
      if (settings.writingTime && !isWritingPhase) {
        setTimeout(() => {
          setIsWritingPhase(true);
          setCurrentTime(10);
          updateStatusLabel(mode, segmentIndex, true);
          setIsRunning(true);
        }, 1000);
      } else {
        setIsWritingPhase(false);
        setSegmentIndex(0);
        setCurrentTime(MODE_CONFIGS[mode].segments[0]);
        updateStatusLabel(mode, 0);
      }
    } else {
      const nextIdx = segmentIndex + 1;
      setSegmentIndex(nextIdx);
      setCurrentTime(config.segments[nextIdx]);
      updateStatusLabel(mode, nextIdx);
    }
  }, [mode, segmentIndex, settings.writingTime, settings.soundEnabled, settings.voiceEnabled, isWritingPhase, updateStatusLabel]);

  const toggleTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      const config = MODE_CONFIGS[mode];
      if (currentTime === config.segments[segmentIndex] && !isWritingPhase && settings.soundEnabled) {
        audioService.playSound('gong');
      }
      setIsRunning(true);
    }
  }, [isRunning, mode, currentTime, segmentIndex, isWritingPhase, settings.soundEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (isTyping) return;
      const key = e.key.toLowerCase();
      switch (key) {
        case ' ': e.preventDefault(); toggleTimer(); break;
        case 'enter': e.preventDefault(); resetTimer(); break;
        case 'm': setIsSettingsOpen(prev => !prev); break;
        case 'o': handleModeChange(TimerMode.NORMAL); break;
        case 'd': handleModeChange(TimerMode.DUPLET); break;
        case 'b': handleModeChange(TimerMode.BLITZ); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, resetTimer, handleModeChange]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const config = MODE_CONFIGS[mode];
          const futureSegmentsTime = config.segments.slice(segmentIndex + 1).reduce((a, b) => a + b, 0);
          const globalRemaining = futureSegmentsTime + prev;
          if (isWritingPhase && settings.soundEnabled && prev >= 1) audioService.playSound('tick');
          if (settings.signal10s && globalRemaining === 11 && !isWritingPhase) {
            if (settings.soundEnabled) audioService.playSound('warning');
            if (settings.voiceEnabled) audioService.playVoice('10s_left');
          }
          if (settings.voiceEnabled && globalRemaining <= 10 && globalRemaining >= 1 && !isWritingPhase) {
            audioService.playVoice(`count_${globalRemaining}` as VoiceType);
          }
          if (prev <= 1) { clearInterval(timerRef.current!); handleEndSegment(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else { if (timerRef.current) clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, mode, handleEndSegment, settings.signal10s, settings.soundEnabled, settings.voiceEnabled, isWritingPhase, segmentIndex]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark-theme');
    } else { root.classList.remove('dark-theme'); }
  }, [settings.theme]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-[#f0f4f8] transition-colors duration-300">
      <header className="w-full max-w-6xl flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="app-logo-icon w-12 h-12"><img src="input_file_0.png" alt="Zakovat Logo" className="w-full h-full object-contain" /></div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-700 tracking-tight">Zakovat taymeri</h1>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 rounded-xl neumorphic-flat neumorphic-active flex items-center justify-center text-gray-500"><i className="fa-solid fa-bars"></i></button>
      </header>
      <div className="flex-1 w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-12">
        <div className="flex flex-col items-center w-full lg:max-w-md">
          <CircularTimer currentTime={currentTime} totalTime={MODE_CONFIGS[mode].segments[segmentIndex]} statusText={statusText} mode={mode} segmentIndex={segmentIndex} isWritingPhase={isWritingPhase} useArrow={settings.useArrow} counterClockwise={settings.counterClockwise} />
          <div className="flex items-center justify-center gap-8 mb-10">
            <button onClick={() => resetTimer()} className="w-14 h-14 md:w-16 md:h-16 rounded-full neumorphic-flat neumorphic-active flex items-center justify-center text-gray-500 text-lg md:text-xl"><i className="fa-solid fa-rotate-left"></i></button>
            <button onClick={toggleTimer} className="w-20 h-20 md:w-24 md:h-24 rounded-full neumorphic-flat neumorphic-active flex items-center justify-center text-[#10254E] text-3xl md:text-4xl"><i className={`fa-solid ${isRunning ? 'fa-pause' : 'fa-play ml-1'}`}></i></button>
            <div className="w-14 h-14 md:w-16 md:h-16 opacity-0"></div>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full max-w-sm px-2 mb-8">
            {(Object.keys(MODE_CONFIGS) as TimerMode[]).map((m) => (
              <button key={m} onClick={() => handleModeChange(m)} className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-3xl neumorphic-flat transition-all ${mode === m ? 'active-mode' : 'text-gray-400'}`}>
                <div className="flex gap-1 mb-2">
                  {MODE_CONFIGS[m].segments.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${mode === m && segmentIndex >= i ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                  ))}
                </div>
                <span className="text-[9px] md:text-xs font-bold tracking-widest uppercase">{MODE_CONFIGS[m].label}</span>
              </button>
            ))}
          </div>
        </div>
        {settings.aiTrainingEnabled && <div className="w-full lg:flex-1 animate-fadeIn"><QuestionPanel /></div>}
      </div>
      <SettingsDrawer settings={settings} updateSettings={(s) => setSettings(prev => ({...prev, ...s}))} isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <footer className="mt-8 py-4 text-gray-400 text-[10px] font-bold tracking-widest uppercase text-center w-full">Zakovat Professional Taymeri</footer>
    </div>
  );
};

export default App;
```

## 9. /index.html
```html
<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Zakovat taymeri</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        :root { --bg-color: #f0f4f8; --shadow-light: #ffffff; --shadow-dark: #d1d9e6; --text-color: #2c3e50; --accent-color: #10254E; --danger-color: #e63946; }
        .dark-theme { --bg-color: #1a1c1e; --shadow-light: #25282c; --shadow-dark: #0f1012; --text-color: #e2e2e2; --accent-color: #10254E; }
        body { font-family: 'Outfit', sans-serif; background-color: var(--bg-color); color: var(--text-color); transition: background-color 0.3s ease, color 0.3s ease; -webkit-tap-highlight-color: transparent; overflow-x: hidden; }
        .neumorphic-flat { background: var(--bg-color); box-shadow: 10px 10px 20px var(--shadow-dark), -10px -10px 20px var(--shadow-light); }
        .neumorphic-inset { background: var(--bg-color); box-shadow: inset 6px 6px 12px var(--shadow-dark), inset -6px -6px 12px var(--shadow-light); }
        .neumorphic-convex { background: var(--bg-color); box-shadow: 15px 15px 30px var(--shadow-dark), -15px -15px 30px var(--shadow-light); }
        .neumorphic-active:active, .active-mode { box-shadow: inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light); color: var(--accent-color); }
        .progress-ring__circle { transition: stroke-dashoffset 0.1s linear, stroke 0.5s ease; transform: rotate(-90deg); transform-origin: 50% 50%; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .toggle-switch { width: 44px; height: 24px; border-radius: 12px; position: relative; cursor: pointer; transition: 0.3s; }
        .toggle-switch::after { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; top: 3px; left: 3px; background: #fff; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .toggle-active.toggle-switch { background: #10254E; }
        .toggle-active.toggle-switch::after { left: 23px; }
        .toggle-inactive.toggle-switch { background: #cbd5e1; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
</body>
</html>
```
