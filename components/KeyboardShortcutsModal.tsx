import React from 'react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const ShortcutRow = ({ label, keys }: { label: string, keys: string[] }) => (
    <div className="flex justify-between items-center py-2.5 last:border-0 px-2 rounded-lg transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="flex gap-1.5">
        {keys.map((k, i) => (
          <kbd key={i} className="px-2.5 py-1 rounded-md shadow-sm text-[11px] font-mono font-extrabold uppercase tracking-wider" style={{ backgroundColor: 'var(--kbd-bg)', borderBottom: '2px solid var(--kbd-border)', color: 'var(--kbd-text)' }}>
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}></div>
      
      {/* Modal Box */}
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--card-border)' }}>
        
        {/* Header */}
        <div className="p-6 flex justify-between items-center backdrop-blur-md" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--header-bg)' }}>
          <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--accent-color)' }}>
            <i className="fa-solid fa-keyboard" style={{ opacity: 0.7 }}></i> 
            Klaviatura boshqaruvi
          </h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl shadow-sm hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg-solid)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto w-full grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          
          {/* Column 1 */}
          <div>
          <h3 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--section-heading)' }}>
              <i className="fa-solid fa-gamepad opacity-50"></i> Asosiy boshqaruv
            </h3>
            <div className="rounded-2xl p-3 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <ShortcutRow label="Boshlash / To'xtatish" keys={['Space']} />
              <ShortcutRow label="Qayta tiklash (Reset)" keys={['Enter']} />
              <ShortcutRow label="Sozlamalar oynasi" keys={['M']} />
              <ShortcutRow label="Ushbu yorliqlar oynasi" keys={['K']} />
              <ShortcutRow label="Oynalarni yopish" keys={['Esc']} />
            </div>

            <h3 className="text-[11px] font-black uppercase tracking-widest mt-8 mb-3 flex items-center gap-2" style={{ color: 'var(--section-heading)' }}>
              <i className="fa-solid fa-stopwatch opacity-50"></i> Taymer rejimlari
            </h3>
            <div className="rounded-2xl p-3 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <ShortcutRow label="Oddiy rejim" keys={['O']} />
              <ShortcutRow label="Duplet rejimi" keys={['D']} />
              <ShortcutRow label="Blits rejimi" keys={['B']} />
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--section-heading)' }}>
              <i className="fa-solid fa-sliders opacity-50"></i> Tezkor sozlamalar
            </h3>
            <div className="rounded-2xl p-3 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <ShortcutRow label="Strelkali rejim" keys={['S']} />
              <ShortcutRow label="Teskari sanash" keys={['T']} />
              <ShortcutRow label="10 soniya signali" keys={['1']} />
              <ShortcutRow label="Yozuv vaqti (+10s)" keys={['J']} />
              <ShortcutRow label="Elektron signal (tovush)" keys={['X']} />
              <ShortcutRow label="Inson ovozi" keys={['I']} />
              <ShortcutRow label="Vibratsiya" keys={['V']} />
            </div>

            <h3 className="text-[11px] font-black uppercase tracking-widest mt-8 mb-3 flex items-center gap-2" style={{ color: 'var(--section-heading)' }}>
              <i className="fa-solid fa-palette opacity-50"></i> Dizayn
            </h3>
            <div className="rounded-2xl p-3 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <ShortcutRow label="Yorug' mavzu" keys={['Y']} />
              <ShortcutRow label="Qorong'u mavzu" keys={['Q']} />
              <ShortcutRow label="Auto mavzu" keys={['A']} />
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 text-center text-[11px] font-bold tracking-wide uppercase" style={{ backgroundColor: 'var(--footer-bg)', color: 'var(--accent-color)', borderTop: '1px solid var(--footer-border)' }}>
          Ushbu menyuni ochish uchun xohlagan vaqtingiz <kbd className="px-1.5 py-0.5 rounded mx-1 shadow-sm" style={{ backgroundColor: 'var(--kbd-bg)', borderBottom: '2px solid var(--kbd-border)' }}>K</kbd> tugmasini bosing
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
