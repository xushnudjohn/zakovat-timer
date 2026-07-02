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

  const SettingRow = ({ label, description, active, onClick, hotkey }: { label: string, description?: string, active: boolean, onClick: () => void, hotkey?: string }) => (
    <div className="flex items-center justify-between py-2.5 last:border-0 group cursor-pointer" onClick={onClick} style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="flex-1 pr-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {hotkey && <kbd className="px-1.5 py-0.5 text-[9px] rounded-md font-mono transition-all" style={{ backgroundColor: 'var(--kbd-bg)', border: '1px solid var(--kbd-border)', color: 'var(--text-muted)' }}>{hotkey}</kbd>}
        </h3>
        {description && <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      <div 
        className={`toggle-switch ${active ? 'toggle-active' : 'toggle-inactive'} pointer-events-none scale-90 origin-right`}
      ></div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fadeIn" onClick={onClose}></div>
      <div
        className="relative w-full max-w-sm h-full neumorphic-flat overflow-y-auto animate-slideLeft flex flex-col"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)',
          paddingLeft: '1.25rem',
          paddingRight: '1.25rem',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-secondary)' }}>Sozlamalar</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl neumorphic-flat neumorphic-active flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div className="space-y-4 flex-1">
          <section className="mb-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--section-heading)' }}>1. Siferblat</h4>
            <div className="space-y-1">
              <SettingRow 
                label="Strelkali rejim" 
                description="Raqamlar o‘rniga soat milini ko‘rsatish" 
                active={settings.useArrow} 
                onClick={() => updateSettings({ useArrow: !settings.useArrow })}
                hotkey="S"
              />
              <SettingRow 
                label="Teskari sanash" 
                description="Soat miliga teskari sanashni yoqish" 
                active={settings.counterClockwise} 
                onClick={() => updateSettings({ counterClockwise: !settings.counterClockwise })}
                hotkey="T"
              />
            </div>
          </section>

          <section className="mb-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--section-heading)' }}>2. Vaqtni sanash</h4>
            <div className="space-y-1">
              <SettingRow 
                label="10 soniya signali" 
                description="Vaqt tugashiga 10s qolganda signal berish" 
                active={settings.signal10s} 
                onClick={() => updateSettings({ signal10s: !settings.signal10s })}
                hotkey="1"
              />
              <SettingRow 
                label="Javobni yozish vaqti" 
                description="Asosiy vaqtdan so‘ng 10 soniya qo‘shish" 
                active={settings.writingTime} 
                onClick={() => updateSettings({ writingTime: !settings.writingTime })}
                hotkey="J"
              />
            </div>
          </section>

          <section className="mb-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--section-heading)' }}>3. Bildirishnomalar</h4>
            <div className="space-y-1">
              <SettingRow 
                label="Signal" 
                description="Taymerning standart elektron signallari"
                active={settings.soundEnabled} 
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                hotkey="X"
              />
              <SettingRow
                label="Inson ovozi"
                description="Ovozli ogohlantirishlar va teskari sanash"
                active={settings.voiceEnabled}
                onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                hotkey="I"
              />
              <SettingRow
                label="Vibratsiya"
                description="Muhim lahzalarda telefon vibratsiyalanadi"
                active={settings.hapticEnabled}
                onClick={() => updateSettings({ hapticEnabled: !settings.hapticEnabled })}
                hotkey="V"
              />
            </div>
          </section>

          <section className="mb-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--section-heading)' }}>4. Ranglar mavzusi</h4>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as ThemeType[]).map((t) => (
                <button 
                  key={t} 
                  onClick={() => updateSettings({ theme: t })} 
                  className={`py-2 rounded-xl neumorphic-flat text-[10px] font-bold uppercase transition-all flex flex-row items-center justify-center gap-1.5 ${settings.theme === t ? 'active-mode' : ''}`}
                  style={{ color: settings.theme === t ? 'var(--accent-color)' : 'var(--text-muted)' }}
                >
                  <span>{t === 'light' ? "Yorug'" : t === 'dark' ? "Qorong'u" : 'Auto'}</span>
                    <kbd className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all`}
                      style={{
                        backgroundColor: settings.theme === t ? 'var(--accent-color)' : 'var(--kbd-bg)',
                        color: settings.theme === t ? '#ffffff' : 'var(--text-muted)',
                        opacity: settings.theme === t ? 0.9 : 1
                      }}
                    >
                      {t === 'light' ? 'Y' : t === 'dark' ? 'Q' : 'A'}
                    </kbd>
                </button>
              ))}
            </div>
          </section>
        </div>
        
        <div className="pt-3 pb-1 text-center text-[9px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>
          Zakovat taymeri v2.0
        </div>
        <div className="pb-2 text-center text-[9px] tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Muallif: Xushnudbek Xudayberdiyev
        </div>
      </div>
    </div>
  );
};

export default SettingsDrawer;