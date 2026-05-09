import { useState, useRef, useEffect } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { LANGUAGE_COMPLETIONS } from '../utils/completionData';

interface EditorProps {
  language: string;
  code: string;
  onChange: (value: string | undefined) => void;
}

const Editor = ({ language, code, onChange }: EditorProps) => {
  const [isMobile, setIsMobile] = useState(false);

  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'java': return 'java';
      case 'javascript': return 'javascript';
      case 'python': return 'python';
      default: return 'javascript';
    }
  };

  const isMobileDevice = () => {
    // Show the bottom helper bar on narrow viewports,
    // including mobile preview mode in the browser.
    return window.matchMedia('(max-width: 768px)').matches;
  };

  const [menu, setMenu] = useState<{ x: number, y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<any>(null);

  useEffect(() => {
    const updateMobile = () => setIsMobile(isMobileDevice());
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  const MOBILE_INSERTS: Record<string, string> = {
    Tab: '\t',
    '{}': '{}',
    '()': '()',
    '[]': '[]',
    '<>': '<>',
    '""': '""',
    "''": "''",
    ';': ';',
    '=': '=',
    '+': '+',
    '-': '-',
    '!': '!',
    '$': '$',
    '&': '&',
    '#': '#',
    '%': '%',
    '|': '|',
    '^': '^',
    '\\': '\\',
    '/': '/',
    '.': '.',
    ',': ',',
    '<': '<',
    '>': '>',
    '←': '←',
    '↑': '↑',
    '↓': '↓',
    '→': '→',
  };

  const insertMobileText = (key: string) => {
    const editor = (window as any).monacoEditor;
    if (!editor) return;

    const selection = editor.getSelection();
    const insertText = MOBILE_INSERTS[key] || key;
    const pairKeys = ['{}', '()', '[]', '<>', '""', "''"];
    editor.executeEdits('mobile-helper', [{ range: selection, text: insertText, forceMoveMarkers: true }]);

    if (pairKeys.includes(key)) {
      const position = editor.getPosition();
      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column - (insertText.length / 2),
      });
    }

    editor.focus();
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0d0d0f',
        'editorCursor.foreground': '#ffffff',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#1a1a1d',
      }
    });

    monaco.editor.setTheme('custom-dark');

    // Register completions
    if (!(monaco as any).__completionsRegistered) {
      Object.entries(LANGUAGE_COMPLETIONS).forEach(([lang, items]) => {
        monaco.languages.registerCompletionItemProvider(lang, {
          provideCompletionItems: (model: any, position: any) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };
            return {
              suggestions: items.map((item) => ({
                label: item.label,
                kind: item.kind,
                insertText: item.insertText,
                detail: item.detail,
                documentation: item.documentation,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: range,
              })),
            };
          },
        });
      });
      (monaco as any).__completionsRegistered = true;
    }

    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', monospace",
      minimap: { enabled: false },
      wordWrap: 'on',
      automaticLayout: true,
      contextmenu: false,
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      scrollBeyondLastLine: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      showUnused: false,
    });

    // Hide the mobile keyboard button injected by Monaco
    const hideKeyboardBtn = () => {
      const btns = document.querySelectorAll(
        '.showKeyboardButton, .show-keyboard-button, [class*="keyboard"][class*="button"]'
      );
      btns.forEach(el => ((el as HTMLElement).style.display = 'none'));
    };
    hideKeyboardBtn();
    setTimeout(hideKeyboardBtn, 500);
    setTimeout(hideKeyboardBtn, 1500);

    const container = containerRef.current;

    if (container && isMobileDevice() && !(container as any).__longPressAdded) {
      let startX = 0;
      let startY = 0;

      const clearTimer = () => {
        if (pressTimerRef.current) {
          clearTimeout(pressTimerRef.current);
          pressTimerRef.current = null;
        }
      };

      container.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        startX = e.clientX;
        startY = e.clientY;
        clearTimer();
        pressTimerRef.current = setTimeout(() => {
          setMenu({ x: e.clientX, y: e.clientY });
          if ('vibrate' in navigator) navigator.vibrate(50);
        }, 600);
      }, { passive: true });

      container.addEventListener('pointermove', (e) => {
        if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
          clearTimer();
        }
      }, { passive: true });

      container.addEventListener('pointerup', () => { clearTimer(); }, { passive: true });
      container.addEventListener('contextmenu', (e) => e.preventDefault());
      (container as any).__longPressAdded = true;
    }

    (window as any).monacoEditor = editor;
  };

  // Toolbar actions — exactly like photo: Select All | Copy | Cut | Paste + Close below
  const TOOLBAR_ITEMS = [
    {
      label: 'Select All',
      action: () => {
        const ed = (window as any).monacoEditor;
        if (ed) ed.setSelection(ed.getModel().getFullModelRange());
        // don't close, so user can see selection
      },
    },
    {
      label: 'Copy',
      action: () => {
        const ed = (window as any).monacoEditor;
        if (ed) {
          const sel = ed.getSelection();
          const text = ed.getModel().getValueInRange(sel) || ed.getValue();
          navigator.clipboard.writeText(text);
        }
        setMenu(null);
      },
    },
    {
      label: 'Cut',
      action: () => {
        const ed = (window as any).monacoEditor;
        if (ed) {
          const sel = ed.getSelection();
          const text = ed.getModel().getValueInRange(sel);
          navigator.clipboard.writeText(text);
          ed.executeEdits('cut', [{ range: sel, text: '' }]);
        }
        setMenu(null);
      },
    },
    {
      label: 'Paste',
      action: async () => {
        try {
          const text = await navigator.clipboard.readText();
          const ed = (window as any).monacoEditor;
          if (ed) {
            const sel = ed.getSelection();
            ed.executeEdits('paste', [{ range: sel, text }]);
          }
        } catch (err) {
          console.error('Paste failed:', err);
        }
        setMenu(null);
      },
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`editor-container${isMobile ? ' mobile-with-bar' : ''}`}
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
        paddingBottom: isMobile ? '92px' : undefined,
      }}
    >
      <MonacoEditor
        height={isMobile ? 'calc(100% - 92px)' : '100%'}
        language={getMonacoLanguage(language)}
        value={code}
        theme="custom-dark"
        onChange={onChange}
        onMount={handleEditorDidMount}
      />

      {/* Mobile Toolbar — exactly like photo */}
      {menu && (
        <div
          style={{
            position: 'fixed',
            top: Math.max(60, menu.y - 80),
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#2c2c31',
            borderRadius: '10px',
            zIndex: 10000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            border: '1px solid #3a3a40',
            overflow: 'hidden',
            minWidth: '280px',
          }}
        >
          {/* Row 1: Select All | Copy | Cut | Paste */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #3a3a40' }}>
            {TOOLBAR_ITEMS.map((item, idx) => (
              <div key={item.label} style={{ display: 'flex', flex: 1 }}>
                <button
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onClick={(e) => { e.stopPropagation(); item.action(); }}
                  style={{
                    flex: 1,
                    padding: '14px 0',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {item.label}
                </button>
                {idx < TOOLBAR_ITEMS.length - 1 && (
                  <div style={{ width: '1px', background: '#3a3a40', alignSelf: 'stretch' }} />
                )}
              </div>
            ))}
          </div>

          {/* Row 2: Close */}
          <button
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onClick={(e) => { e.stopPropagation(); setMenu(null); }}
            style={{
              width: '100%',
              padding: '12px 0',
              color: '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: '500',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Close
          </button>
        </div>
      )}

      {isMobile && (
        <div className="mobile-keybar">
          {['Tab', '{}', '()', '[]', '<>', '""', "''", ';', '=', '+', '-', '!', '$', '&', '#', '%', '|', '^', '\\', '/', '.', ',', '<', '>', '←', '↑', '↓', '→'].map((key) => (
            <button
              key={key}
              onClick={() => insertMobileText(key)}
              className="mobile-keybar-button"
              type="button"
            >
              {key}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Editor;
