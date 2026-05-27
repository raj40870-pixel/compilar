import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => {
    return window.innerWidth <= 1024;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return mobile;
}

const CustomSelect = ({ options, value, onChange }: CustomSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);
  const mobile = useIsMobile();

  // Close on outside click / touch
  useEffect(() => {
    const handleClick = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>

      {/* ── TRIGGER BUTTON ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#141416',
          border: 'none',
          color: '#ffffff',
          WebkitTextFillColor: '#ffffff',
          fontWeight: 500,
          fontSize: '0.9rem',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: '4px',
          fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent',
          WebkitAppearance: 'none',
          appearance: 'none' as any,
        }}
      >
        {selected?.name}
        <ChevronDown
          size={16}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            color: '#94a3b8',
          }}
        />
      </button>

      {open && (
        <>
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '160px',
            maxWidth: mobile ? '250px' : undefined,
            maxHeight: mobile ? '50vh' : undefined,
            background: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            zIndex: 9999,
            overflowY: mobile ? 'auto' : 'hidden',
            overflowX: 'hidden',
          }}>
              {options.map((opt, idx) => (
                <button
                  key={opt.id}
                  onClick={() => { onChange(opt.id); setOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    background: opt.id === value ? '#f0faf8' : '#ffffff',
                    border: 'none',
                    borderBottom: idx < options.length - 1 ? '1px solid #f0f0f0' : 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    color: '#000000',
                    WebkitTextFillColor: '#000000',
                    fontSize: '0.95rem',
                    fontWeight: opt.id === value ? 600 : 400,
                    textAlign: 'left',
                  } as any}
                  onMouseEnter={e => (e.currentTarget.style.background = opt.id === value ? '#e6f7f5' : '#f9f9f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = opt.id === value ? '#f0faf8' : '#ffffff')}
                >
                  <span style={{ color: '#000000', WebkitTextFillColor: '#000000' } as any}>
                    {opt.name}
                  </span>
                  <div style={{
                    width: '18px', height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${opt.id === value ? '#00897b' : '#aaaaaa'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {opt.id === value && (
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#00897b' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
        </>
      )}
    </div>
  );
};

export default CustomSelect;
