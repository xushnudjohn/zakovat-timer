
import { SoundType, VoiceType } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public voiceEnabled: boolean = false;

  private voiceFiles: Record<VoiceType, string> = {
    '10s_left': "/10_soniya_qoldi.WAV",
    'time_up': "/vaqt_boldi.WAV",
    'count_1': '/1.WAV',
    'count_2': '/2.WAV',
    'count_3': '/3.WAV',
    'count_4': '/4.WAV',
    'count_5': '/5.WAV',
    'count_6': '/6.WAV',
    'count_7': '/7.WAV',
    'count_8': '/8.WAV',
    'count_9': '/9.WAV',
    'count_10': '/10.WAV',
  };

  private voiceBuffers: Record<string, AudioBuffer> = {};

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
        // Javobni yozish vaqti uchun qisqa va o'tkir gudok (beep)
        createOscillator(1000, 'square', now, 0.08, 0.25);
        break;
      case 'end':
        createOscillator(600, 'square', now, 1.0, 0.4);
        break;
    }
  }

  public async loadVoices() {
    this.init();
    if (!this.ctx) return;
    
    const fetchPromises = Object.entries(this.voiceFiles).map(async ([key, path]) => {
      if (!this.voiceBuffers[key]) {
        try {
          const response = await fetch(encodeURI(path));
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const arrayBuffer = await response.arrayBuffer();
          const decoded = await this.ctx!.decodeAudioData(arrayBuffer);
          this.voiceBuffers[key] = decoded;
        } catch (e) {
          console.error(`Failed to preload voice: ${key} -> ${path}`, e);
        }
      }
    });
    
    await Promise.allSettled(fetchPromises);
  }

  public playVoice(type: VoiceType) {
    if (!this.voiceEnabled) return;
    this.init();
    
    // Web Audio API buffer orqali chalish (brauzer block qilib qo'yishini oldini oladi)
    const buffer = this.voiceBuffers[type];
    if (buffer && this.ctx) {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
    } else {
      // Agar buffer yuklanishga ulgurmagan bo'lsa yoki xato bo'lsa (Fallback)
      const url = encodeURI(this.voiceFiles[type]);
      const audio = new Audio(url);
      audio.play().catch(e => console.error("Audio playback fallback failed for", url, e));
    }
  }
}

export const audioService = new AudioService();
