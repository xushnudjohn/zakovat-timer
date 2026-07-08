import React, { useState, useEffect, useCallback, useRef } from 'react';
import CircularTimer from './components/CircularTimer';
import SettingsDrawer from './components/SettingsDrawer';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { TimerMode, AppSettings, VoiceType } from './types';
import { MODE_CONFIGS } from './constants';
import { audioService } from './services/audio';
import {
  keepScreenOn,
  allowScreenOff,
  hapticStart,
  hapticWarning,
  hapticEnd,
  setHapticsEnabled,
} from './services/mobile';
import {
  ensureNotificationPermission,
  scheduleTimerNotifications,
  cancelTimerNotifications,
} from './services/notifications';
import {
  startLiveActivity,
  updateLiveActivity,
  endLiveActivity,
} from './services/liveActivity';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

const App: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.NORMAL);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(MODE_CONFIGS[TimerMode.NORMAL].segments[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [isWritingPhase, setIsWritingPhase] = useState(false);
  const [statusText, setStatusText] = useState('Tayyor');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Standart sozlamalar (po umolchaniye)
  const [settings, setSettings] = useState<AppSettings>({
    useArrow: false,           // Strelkali rejim - o'chiq
    counterClockwise: true,    // Teskari sanash - yoniq
    signal10s: true,           // 10 soniya signali - yoniq
    writingTime: true,         // Javobni yozish vaqti - yoniq
    soundEnabled: true,        // Ovoz (Signal) - yoniq
    voiceEnabled: false,       // Inson ovozi - o'chiq (so'rovda ko'rsatilmagani uchun)
    hapticEnabled: true,       // Vibratsiya - yoniq (faqat mobil ilovada ta'sir qiladi)
    theme: 'light'             // Ranglar mavzusi - Yorug'
  });

  const timerRef = useRef<any>(null);
  const backgroundedAtRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const isWritingPhaseRef = useRef(false);
  const currentTimeRef = useRef(0);
  // Set when the segment end already happened while backgrounded (the
  // local notification alerted the user) so we don't alert twice.
  const skipEndAlertRef = useRef(false);

  const modeRef = useRef(mode);
  const segmentIndexRef = useRef(0);
  // Seconds of writing phase that auto-follow the current running main
  // segment (10 if the last segment has writingTime; 0 otherwise). Lets the
  // resume logic carry the countdown continuously into the writing phase.
  const writingTailRef = useRef(0);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { segmentIndexRef.current = segmentIndex; }, [segmentIndex]);
  useEffect(() => { isWritingPhaseRef.current = isWritingPhase; }, [isWritingPhase]);

  const updateStatusLabel = useCallback((m: TimerMode, idx: number, isWriting = false) => {
    if (isWriting) {
      setStatusText('Vaqt! (Yozish)');
      return;
    }
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

    const skipAlert = skipEndAlertRef.current;
    skipEndAlertRef.current = false;

    if (!skipAlert) {
      if (settings.voiceEnabled) {
        if (isLastSegment) {
          if (!isWritingPhase) {
            audioService.playVoice('time_up'); // oxirgi savol (asosiy vaqt) tugaganida bir marta aytiladi xolos
          }
        } else {
          // oraliq savollar uchun har doim odatiy gong yangraydi
          const originalState = audioService.enabled;
          audioService.enabled = true;
          audioService.playSound('end');
          audioService.enabled = originalState;
        }
      } else if (settings.soundEnabled) {
        audioService.playSound('end');
      }
      hapticEnd();
    }

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
        const startIdx = 0;
        setSegmentIndex(startIdx);
        setCurrentTime(MODE_CONFIGS[mode].segments[startIdx]);
        updateStatusLabel(mode, startIdx);
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
      hapticStart();
    } else {
      const config = MODE_CONFIGS[mode];
      const isStartOfSegment = currentTime === config.segments[segmentIndex];

      if (isStartOfSegment && !isWritingPhase && (settings.soundEnabled || settings.voiceEnabled)) {
        const originalState = audioService.enabled;
        audioService.enabled = true; // Inson ovozi yoniq bo'lganda oddiy audio state'i o'chiq bo'lgan bo'lishi mumkin, uni yoqib gongni chalamiz
        audioService.playSound('gong');
        audioService.enabled = originalState;
      }
      // Set a meaningful status label before running so the Live Activity
      // never shows the idle "Tayyor".
      updateStatusLabel(mode, segmentIndex, isWritingPhase);
      setIsRunning(true);
      hapticStart();
    }
  }, [isRunning, mode, currentTime, segmentIndex, isWritingPhase, settings.soundEnabled, settings.voiceEnabled, updateStatusLabel]);

  // Klaviatura tugmalari hodisalarini kuzatish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Agar foydalanuvchi biror matn maydonida yozayotgan bo'lsa, shortcutlar ishlamasligi kerak
      const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (isTyping) return;

      const key = e.key.toLowerCase();

      // Escape oynalarni yopadi
      if (key === 'escape') {
        setIsSettingsOpen(false);
        setIsShortcutsOpen(false);
        return;
      }

      switch (key) {
        case 'k': // Yorliqlar oynasi
          setIsShortcutsOpen(prev => !prev);
          break;
        case ' ': // Probel
          e.preventDefault();
          toggleTimer();
          break;
        case 'enter': // Reset
          e.preventDefault();
          resetTimer();
          break;
        case 'm': // Menyu
          setIsSettingsOpen(prev => !prev);
          break;
        case 's': // Strelkali rejim
          setSettings(prev => ({ ...prev, useArrow: !prev.useArrow }));
          break;
        case 't': // Teskari sanash
          setSettings(prev => ({ ...prev, counterClockwise: !prev.counterClockwise }));
          break;
        case '1': // 10 soniya signali
          setSettings(prev => ({ ...prev, signal10s: !prev.signal10s }));
          break;
        case 'j': // Javobni yozish
          setSettings(prev => ({ ...prev, writingTime: !prev.writingTime }));
          break;
        case 'x': // Signal (Ovoz)
          setSettings(prev => ({ 
            ...prev, 
            soundEnabled: !prev.soundEnabled,
            voiceEnabled: !prev.soundEnabled ? false : prev.voiceEnabled
          }));
          break;
        case 'i': // Inson ovozi
          setSettings(prev => ({
            ...prev,
            voiceEnabled: !prev.voiceEnabled,
            soundEnabled: !prev.voiceEnabled ? false : prev.soundEnabled
          }));
          break;
        case 'v': // Vibratsiya
          setSettings(prev => ({ ...prev, hapticEnabled: !prev.hapticEnabled }));
          break;
        case 'o': // Oddiy rejim
          handleModeChange(TimerMode.NORMAL);
          break;
        case 'd': // Duplet
          handleModeChange(TimerMode.DUPLET);
          break;
        case 'b': // Blits
          handleModeChange(TimerMode.BLITZ);
          break;
        case 'a': // Auto mavzu
          setSettings(prev => ({ ...prev, theme: 'system' }));
          break;
        case 'y': // Yorug' mavzu
          setSettings(prev => ({ ...prev, theme: 'light' }));
          break;
        case 'q': // Qorong'u mavzu
          setSettings(prev => ({ ...prev, theme: 'dark' }));
          break;
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

          // Javobni yozish vaqtidagi har soniyalik teskari sanoq
          if (isWritingPhase && prev >= 1 && prev <= 10) {
            if (settings.voiceEnabled) {
              const countKey = `count_${prev}` as VoiceType;
              audioService.playVoice(countKey);
            } else if (settings.soundEnabled) {
              audioService.playSound('tick');
            }
            hapticStart();
          }

          // 10 soniya ogohlantirishi — audio birinchi, haptic keyin
          // (aks holda iOS'da haptic audio session'ni bezovta qilishi mumkin)
          if (settings.signal10s && globalRemaining === 11 && !isWritingPhase) {
            if (settings.soundEnabled) {
              audioService.playSound('warning');
            } else if (settings.voiceEnabled) {
              audioService.playVoice('10s_left');
            }
            hapticWarning();
          }

          // (Teskari sanoq mantiqini yuqoriga yozish vaqti blokiga o'zgartirdik, chunki u faqat yozish fazasida bo'lishi kerak. 
          // Shuningdek agar umumiy vaqt yakuni uchun ham kiritmoqchi bo'lsak, isWritingPhase false bo'lganda ham yurgizish mumkin edi, 
          // lekin foydalanuvchi buni faqat "qo'shimcha 10 soniyada" so'ragan)

          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleEndSegment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, handleEndSegment, settings.signal10s, settings.soundEnabled, settings.voiceEnabled, isWritingPhase, segmentIndex]);

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: isDark ? '#0f1117' : '#f0f4f8' }).catch(() => {});
    }
  }, [settings.theme]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(() => {});
      document.documentElement.classList.add('is-native');
      ensureNotificationPermission();
    }
  }, []);

  // Schedule local notifications when the timer starts so the 10s
  // warning and the end signal still fire (sound + vibration) if the
  // WebView is paused in the background. presentationOptions is empty
  // in capacitor.config.ts, so these stay silent while the app is in
  // the foreground and the in-app sounds handle it instead.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (isRunning) {
      // Does a 10s writing phase auto-follow this segment? (last segment,
      // writingTime on, and we're not already in the writing phase.)
      const isLast = segmentIndex >= MODE_CONFIGS[mode].segments.length - 1;
      writingTailRef.current = !isWritingPhase && settings.writingTime && isLast ? 10 : 0;
      scheduleTimerNotifications({
        secondsToEnd: currentTime,
        useVoice: settings.voiceEnabled,
        useBeep: settings.soundEnabled && !settings.voiceEnabled,
        warn10s: settings.signal10s && !isWritingPhase,
      });
    } else {
      cancelTimerNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Live Activity (iOS 16.1+): show the running countdown on the Lock Screen
  // and Dynamic Island. Start/end follows isRunning; endEpochMs lets the OS
  // tick the countdown itself without the app running.
  useEffect(() => {
    if (isRunning) {
      const endMs = Date.now() + currentTime * 1000;
      startLiveActivity('Zakovat taymeri', endMs, statusText);
    } else {
      endLiveActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Re-sync the Live Activity when the segment or phase changes mid-run
  // (new endDate + status), so the countdown reflects the new segment.
  useEffect(() => {
    if (!isRunningRef.current) return;
    const endMs = Date.now() + currentTimeRef.current * 1000;
    updateLiveActivity(endMs, statusText, false, currentTimeRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusText, segmentIndex, isWritingPhase]);

  // When the app is backgrounded WebView JS pauses, so the setInterval
  // stops ticking. Catch up here: record the timestamp on background,
  // and on resume decrement currentTime by the elapsed seconds so the
  // timer stays wall-clock-accurate.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let pauseHandle: any;
    let resumeHandle: any;
    CapApp.addListener('pause', () => {
      if (isRunningRef.current) backgroundedAtRef.current = Date.now();
    }).then(h => { pauseHandle = h; });
    CapApp.addListener('resume', () => {
      const bg = backgroundedAtRef.current;
      backgroundedAtRef.current = null;
      if (bg == null || !isRunningRef.current) return;
      const elapsed = Math.floor((Date.now() - bg) / 1000);
      if (elapsed <= 0) return;

      const prev = currentTimeRef.current;

      // Still inside the current segment — just catch the countdown up.
      if (elapsed < prev) {
        setCurrentTime(prev - elapsed);
        return;
      }

      // The current segment ended while backgrounded. Its end alert already
      // fired via the scheduled notification, so suppress the in-app one.
      skipEndAlertRef.current = true;
      const overflow = elapsed - prev; // time spent past the segment end
      const tail = writingTailRef.current;
      const m = modeRef.current;

      const finishReset = () => {
        writingTailRef.current = 0;
        setIsWritingPhase(false);
        setSegmentIndex(0);
        setCurrentTime(MODE_CONFIGS[m].segments[0]);
        updateStatusLabel(m, 0);
        setIsRunning(false);
      };

      if (!isWritingPhaseRef.current && tail > 0) {
        // Main segment ended; the writing phase should be running now.
        writingTailRef.current = 0;
        if (overflow < tail) {
          setIsWritingPhase(true);
          setCurrentTime(tail - overflow);
          updateStatusLabel(m, segmentIndexRef.current, true);
          // isRunning stays true → the interval keeps ticking the writing phase.
        } else {
          // Main + writing both elapsed while backgrounded.
          finishReset();
        }
      } else if (isWritingPhaseRef.current) {
        // Writing phase itself ended while backgrounded.
        finishReset();
      } else {
        // A non-last segment (Duplet/Blitz) ended: let the interval run
        // handleEndSegment, which advances and waits for a manual start.
        setCurrentTime(0);
      }
    });
    return () => {
      pauseHandle?.remove();
      resumeHandle?.remove();
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      keepScreenOn();
    } else {
      allowScreenOff();
    }
    return () => { allowScreenOff(); };
  }, [isRunning]);

  useEffect(() => {
    audioService.enabled = settings.soundEnabled;
    audioService.voiceEnabled = settings.voiceEnabled;
    if (settings.voiceEnabled) {
      audioService.loadVoices().catch(e => console.error("Could not preload voices", e));
    }
  }, [settings.soundEnabled, settings.voiceEnabled]);

  useEffect(() => {
    setHapticsEnabled(settings.hapticEnabled);
  }, [settings.hapticEnabled]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-color)' }}>
      <header className="w-full max-w-6xl flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="app-logo-icon w-12 h-12">
            <img src="/zakovat-logo.png" alt="Zakovat Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--accent-color)' }}>Zakovat taymeri</h1>
        </div>
        <div className="flex items-center gap-3">
          {!Capacitor.isNativePlatform() && (
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="w-10 h-10 rounded-xl neumorphic-flat neumorphic-active flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Klaviatura yorliqlari (K)"
            >
              <i className="fa-solid fa-keyboard"></i>
            </button>
          )}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-xl neumorphic-flat neumorphic-active flex items-center justify-center tooltip-trigger relative"
            style={{ color: 'var(--text-muted)' }}
            title="Sozlamalar (M)"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>
      </header>

      <div className="flex-1 w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-12 transition-all duration-300">
        <div className="flex flex-col items-center w-full lg:max-w-md">
          <CircularTimer 
            currentTime={currentTime} 
            totalTime={MODE_CONFIGS[mode].segments[segmentIndex]} 
            statusText={statusText}
            mode={mode}
            segmentIndex={segmentIndex}
            isWritingPhase={isWritingPhase}
            onReset={() => resetTimer()}
            useArrow={settings.useArrow}
            counterClockwise={settings.counterClockwise}
          />

          <div className="flex items-center justify-center gap-8 mb-10">
            <button 
              onClick={() => resetTimer()}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full neumorphic-flat neumorphic-active flex items-center justify-center text-lg md:text-xl transition-all"
              style={{ color: 'var(--text-muted)' }}
              title="Qayta tiklash (Enter)"
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
            
            <button 
              onClick={toggleTimer}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full neumorphic-flat neumorphic-active flex items-center justify-center text-3xl md:text-4xl transition-all"
              style={{ color: 'var(--accent-color)' }}
              title={isRunning ? "To'xtatish (Space)" : "Boshlash (Space)"}
            >
              <i className={`fa-solid ${isRunning ? 'fa-pause' : 'fa-play ml-1'}`}></i>
            </button>

            <div className="w-14 h-14 md:w-16 md:h-16 opacity-0"></div>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-sm px-2 mb-8">
            {(Object.keys(MODE_CONFIGS) as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-3xl neumorphic-flat transition-all ${mode === m ? 'active-mode' : ''}`}
                style={{ color: mode === m ? 'var(--accent-color)' : 'var(--text-muted)' }}
              >
                <div className="flex gap-1 mb-2">
                  {MODE_CONFIGS[m].segments.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full`} style={{ backgroundColor: mode === m && segmentIndex >= i ? 'var(--danger-color)' : 'var(--tick-color)' }}></div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] md:text-xs font-bold tracking-widest uppercase">{MODE_CONFIGS[m].label}</span>
                  <kbd className={`px-1 py-0.5 rounded text-[8px] font-mono font-bold transition-all`}
                    style={{ 
                      backgroundColor: mode === m ? 'var(--accent-color)' : 'var(--kbd-bg)', 
                      color: mode === m ? '#ffffff' : 'var(--text-muted)',
                      opacity: mode === m ? 0.9 : 1
                    }}
                  >
                    {m === 'normal' ? 'O' : m === 'duplet' ? 'D' : 'B'}
                  </kbd>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <SettingsDrawer 
        settings={settings} 
        updateSettings={(s) => {
          setSettings(prev => {
            let nextSettings = { ...prev, ...s };
            if (s.soundEnabled === true) {
              nextSettings.voiceEnabled = false;
            }
            if (s.voiceEnabled === true) {
              nextSettings.soundEnabled = false;
            }
            return nextSettings;
          });
        }} 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <KeyboardShortcutsModal 
        isOpen={isShortcutsOpen} 
        onClose={() => setIsShortcutsOpen(false)} 
      />

      <footer className="mt-8 py-4 text-[10px] font-bold tracking-widest uppercase text-center w-full" style={{ color: 'var(--text-muted)' }}>
        Zakovat Professional Taymeri
      </footer>
    </div>
  );
};

export default App;