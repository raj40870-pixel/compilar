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

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;
  const [menu, setMenu] = useState<{ x: number, y: number, isMonaco?: boolean } | null>(null);
  const touchTimer = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    // Block default Ctrl+F2, Ctrl+F12 and F12
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F2, () => {});
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F12, () => {});
    editor.addCommand(monaco.KeyCode.F12, () => {}); // Block plain F12

    // Enhance cursor
    editor.updateOptions({
      cursorSmoothCaretAnimation: 'on',
      cursorBlinking: 'smooth',
      cursorStyle: 'line',
      cursorWidth: 3,
      contextmenu: false, // Disable default context menu
    });

    // Handle custom context menu
    editor.onContextMenu((e) => {
      e.event.preventDefault();
      e.event.stopPropagation();
      setMenu({ 
        x: e.event.posx, 
        y: e.event.posy,
        isMonaco: true
      });
    });

    (window as any).monacoEditor = editor;
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

  const insertText = (text: string) => {
    const textarea = document.getElementById('mobile-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newCode = code.substring(0, start) + text + code.substring(end);
    onChange(newCode);

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const moveCursor = (dir: 'up' | 'down' | 'left' | 'right') => {
    const textarea = document.getElementById('mobile-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = code.split('\n');
    
    if (dir === 'left') {
      textarea.setSelectionRange(Math.max(0, start - 1), Math.max(0, start - 1));
    } else if (dir === 'right') {
      textarea.setSelectionRange(Math.min(code.length, start + 1), Math.min(code.length, start + 1));
    } else if (dir === 'up' || dir === 'down') {
      let currentLine = 0;
      let currentCharInLine = 0;
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        if (count + lines[i].length >= start) {
          currentLine = i;
          currentCharInLine = start - count;
          break;
        }
        count += lines[i].length + 1;
      }

      const targetLine = dir === 'up' ? currentLine - 1 : currentLine + 1;
      if (targetLine >= 0 && targetLine < lines.length) {
        let newPos = 0;
        for (let i = 0; i < targetLine; i++) {
          newPos += lines[i].length + 1;
        }
        newPos += Math.min(currentCharInLine, lines[targetLine].length);
        textarea.setSelectionRange(newPos, newPos);
      }
    }
    textarea.focus();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    touchTimer.current = setTimeout(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      setMenu({ x, y });
    }, 600);
  };

  const handleTouchMove = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
  };

  useEffect(() => {
    const handleClick = () => setMenu(null);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F12') {
      e.preventDefault();
    }
  };

  useEffect(() => {
    // Block native context menu on the entire container to ensure mobile native menu is suppressed
    const handler = (e: MouseEvent | TouchEvent) => {
      // If we are on mobile, we always want to prevent default context menu
      // because we have our own long-press logic
      if (isMobile) {
        e.preventDefault();
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('contextmenu', handler);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('contextmenu', handler);
      }
    };
  }, [isMobile]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  if (isMobile) {
    return (
      <div ref={containerRef} className="editor-container" style={{ height: '100%', width: '100%', padding: '0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            id="mobile-editor-textarea"
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
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
              fontFamily: "var(--font-mono)",
              caretColor: '#ff00ff'
            }}
          />
          <div className="selection-handles" style={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0, 
            pointerEvents: 'none', overflow: 'hidden'
          }}>
            <div className="handle start-handle" style={{ 
              position: 'absolute', width: '12px', height: '12px', 
              background: '#ff00ff', borderRadius: '50%', display: 'none'
            }} />
          </div>
        </div>

        <div className="mobile-symbol-toolbar">
          {[
            { label: 'Tab', value: '    ' },
            { label: '{', value: '{' },
            { label: '}', value: '}' },
            { label: '(', value: '(' },
            { label: ')', value: ')' },
            { label: '"', value: '"' },
            { label: "'", value: "'" },
            { label: ';', value: ';' },
            { label: ',', value: ',' },
            { label: ':', value: ':' },
            { label: '↑', action: () => moveCursor('up') },
            { label: '↓', action: () => moveCursor('down') },
            { label: '←', action: () => moveCursor('left') },
            { label: '→', action: () => moveCursor('right') },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.value) {
                  insertText(item.value);
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container" style={{ height: '100%', width: '100%', position: 'relative' }}>
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
      
      {menu && (
        <div className="custom-context-menu" style={{
          position: 'fixed',
          top: Math.max(10, menu.y - 60),
          left: Math.max(10, Math.min(window.innerWidth - 300, menu.x - 150)),
          background: '#2d2d33',
          borderRadius: '100px',
          padding: '4px 16px',
          zIndex: 10000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {[
            { label: 'Select all', action: () => {
              if (menu.isMonaco) {
                const editor = (window as any).monacoEditor;
                if (editor) {
                  editor.setSelection(editor.getModel().getFullModelRange());
                  editor.focus();
                }
              } else {
                const tx = document.getElementById('mobile-editor-textarea') as HTMLTextAreaElement;
                tx?.select();
              }
            }},
            { label: 'Cut', action: () => {
              if (menu.isMonaco) {
                const editor = (window as any).monacoEditor;
                if (editor) {
                  const selection = editor.getSelection();
                  const text = editor.getModel().getValueInRange(selection);
                  navigator.clipboard.writeText(text);
                  editor.executeEdits('cut', [{ range: selection, text: '' }]);
                  editor.focus();
                }
              } else {
                const tx = document.getElementById('mobile-editor-textarea') as HTMLTextAreaElement;
                if (tx) {
                  const start = tx.selectionStart;
                  const end = tx.selectionEnd;
                  const text = code.substring(start, end);
                  navigator.clipboard.writeText(text);
                  onChange(code.substring(0, start) + code.substring(end));
                }
              }
            }},
            { label: 'Copy', action: () => {
              if (menu.isMonaco) {
                const editor = (window as any).monacoEditor;
                if (editor) {
                  const selection = editor.getSelection();
                  const text = editor.getModel().getValueInRange(selection);
                  navigator.clipboard.writeText(text || editor.getValue());
                  editor.focus();
                }
              } else {
                const tx = document.getElementById('mobile-editor-textarea') as HTMLTextAreaElement;
                if (tx) {
                  navigator.clipboard.writeText(code.substring(tx.selectionStart, tx.selectionEnd) || code);
                }
              }
            }},
            { label: 'Paste', action: async () => {
              const text = await navigator.clipboard.readText();
              if (menu.isMonaco) {
                const editor = (window as any).monacoEditor;
                if (editor) {
                  const selection = editor.getSelection();
                  editor.executeEdits('paste', [{ range: selection, text: text, forceMoveMarkers: true }]);
                  editor.focus();
                }
              } else {
                insertText(text);
              }
            }},
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
                color: '#fff', 
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Editor;
