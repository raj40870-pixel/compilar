import { useState, useRef, useEffect } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { LANGUAGE_COMPLETIONS } from '../utils/completionData';

interface EditorProps {
  language: string;
  code: string;
  onChange: (value: string | undefined) => void;
  theme?: string;
}

const Editor = ({ language, code, onChange, theme = 'vs-dark' }: EditorProps) => {
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const [menu, setMenu] = useState<{ x: number, y: number } | null>(null);
  const touchTimer = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Register completions for each language defined in completionData
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

    editor.focus();
  };

  const moveLine = (dir: number) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const lines = code.split('\n');
    let currentLineIndex = 0;
    let charCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= start) {
        currentLineIndex = i;
        break;
      }
      charCount += lines[i].length + 1; // +1 for \n
    }
    
    const targetIndex = currentLineIndex + dir;
    if (targetIndex >= 0 && targetIndex < lines.length) {
      const newLines = [...lines];
      [newLines[currentLineIndex], newLines[targetIndex]] = [newLines[targetIndex], newLines[currentLineIndex]];
      const newCode = newLines.join('\n');
      onChange(newCode);
      
      // Preserve selection (approximate)
      setTimeout(() => {
        textarea.focus();
        const newStart = charCount + (dir === -1 ? - (lines[targetIndex].length + 1) : (lines[targetIndex].length + 1));
        textarea.setSelectionRange(Math.max(0, newStart), Math.max(0, newStart));
      }, 0);
    }
  };

  const deleteLine = () => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const lines = code.split('\n');
    let charCount = 0;
    let currentLineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= start) {
        currentLineIndex = i;
        break;
      }
      charCount += lines[i].length + 1;
    }
    
    if (currentLineIndex !== -1) {
      const newLines = lines.filter((_, i) => i !== currentLineIndex);
      onChange(newLines.join('\n'));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    touchTimer.current = setTimeout(() => {
      setMenu({ x, y });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
  };

  useEffect(() => {
    const handleClick = () => setMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (isMobile) {
    return (
      <div className="editor-container" style={{ height: '100%', width: '100%', padding: '0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div className="mobile-editor-toolbar" style={{ 
          display: 'flex', 
          gap: '8px', 
          padding: '8px', 
          background: 'var(--bg-secondary)', 
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto',
          flexShrink: 0
        }}>
          <button 
            onClick={() => {
              const tx = document.querySelector('textarea');
              tx?.select();
            }}
            style={{ color: 'var(--text-primary)', fontSize: '0.75rem', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}
          >
            SELECT ALL
          </button>
          <button 
            onClick={() => moveLine(-1)}
            style={{ color: 'var(--text-primary)', fontSize: '0.75rem', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}
          >
            ↑ UP
          </button>
          <button 
            onClick={() => moveLine(1)}
            style={{ color: 'var(--text-primary)', fontSize: '0.75rem', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}
          >
            ↓ DOWN
          </button>
          <button 
            onClick={deleteLine}
            style={{ color: 'var(--error)', fontSize: '0.75rem', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}
          >
            ✕ DEL LINE
          </button>
        </div>

        {menu && (
          <div style={{
            position: 'fixed',
            top: menu.y,
            left: menu.x,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '4px',
            zIndex: 10000,
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '120px'
          }}>
            {[
              { label: 'Copy', action: () => {
                navigator.clipboard.writeText(code);
              }},
              { label: 'Paste', action: async () => {
                const text = await navigator.clipboard.readText();
                onChange(code + text);
              }},
              { label: 'Move Up ↑', action: () => moveLine(-1) },
              { label: 'Move Down ↓', action: () => moveLine(1) },
              { label: 'Delete Line', action: () => deleteLine() }
            ].map(item => (
              <button 
                key={item.label}
                onClick={(e) => {
                  e.stopPropagation();
                  item.action();
                  setMenu(null);
                }}
                style={{ 
                  padding: '8px 12px', 
                  color: 'var(--text-primary)', 
                  textAlign: 'left', 
                  fontSize: '0.875rem',
                  borderRadius: '4px'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="mono"
          style={{
            flex: 1,
            width: '100%',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: 'none',
            padding: '16px',
            fontSize: '14px',
            lineHeight: '1.6',
            outline: 'none',
            resize: 'none',
            fontFamily: "var(--font-mono)"
          }}
        />
      </div>
    );
  }

  return (
    <div className="editor-container" style={{ height: '100%', width: '100%' }}>
      <MonacoEditor
        height="100%"
        language={getMonacoLanguage(language)}
        value={code}
        theme={theme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          padding: { top: 16, bottom: 16 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          quickSuggestionsDelay: 10,
          wordBasedSuggestions: "allDocuments",
          suggest: {
            showIcons: true,
            snippetsPreventQuickSuggestions: false,
            filterGraceful: true,
          }
        }}
      />
    </div>
  );
};

export default Editor;
