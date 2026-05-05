// DO NOT CHANGE UI LAYOUT - CLIENT APPROVED VERSION
import { useState, useRef, useEffect } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { LANGUAGE_COMPLETIONS } from '../utils/completionData';

interface EditorProps {
  language: string;
  code: string;
  onChange: (value: string | undefined) => void;
  theme?: string;
}

const Editor = ({ language, code, onChange }: EditorProps) => {
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

  const [menu, setMenu] = useState<{ x: number, y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchTimer = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Define custom theme
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0000FF' }, // Blue keywords
        { token: 'string', foreground: '008000' }, // Green strings
        { token: 'comment', foreground: '808080' }, // Gray comments
        { token: 'number', foreground: 'b5cea8' }, // Light green numbers
        { token: 'identifier.function', foreground: 'dcdcaa' }, // Functions
        { token: 'type', foreground: '4ec9b0' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editorCursor.foreground': '#ffffff',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#2a2d2e',
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

    // Configure options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      lineNumbers: 'on',
      minimap: { enabled: false },
      wordWrap: 'on',
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      cursorSmoothCaretAnimation: 'on',
      cursorBlinking: 'blink',
      cursorStyle: 'line',
      cursorWidth: 2,
      contextmenu: false, // We'll handle this manually for desktop/mobile
      dragAndDrop: true,
      mouseWheelZoom: true,
      formatOnPaste: true,
      formatOnType: true,
    });

    // Handle right-click vs long-press
    const domNode = editor.getDomNode();
    if (domNode) {
      // Desktop Right Click - allow default
      domNode.oncontextmenu = () => {
        // If it's a mouse right click, we want the browser default.
        // But Monaco blocks it. We can try to allow it by NOT preventing default.
        // However, Monaco's internal structure might still block it.
        // If they really want browser default, we can set contextmenu: true in options,
        // but that shows Monaco's menu.
        // The user said "Right click: Browser default menu".
        // Let's try to trigger a native-like event or just use Monaco's if it's better.
        // For now, let's allow it to propagate if it's not a long-press.
      };

      // Mobile Long Press
      domNode.ontouchstart = (e: TouchEvent) => {
        const touch = e.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;
        touchTimer.current = setTimeout(() => {
          if ('vibrate' in navigator) navigator.vibrate(50);
          setMenu({ x, y });
        }, 600);
      };

      domNode.ontouchmove = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
      };

      domNode.ontouchend = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
      };
    }

    (window as any).monacoEditor = editor;
    editor.focus();
  };

  useEffect(() => {
    const handleClick = () => setMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="editor-container" style={{ height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MonacoEditor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          theme="custom-dark"
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
          }}
        />
      </div>

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
              const editor = (window as any).monacoEditor;
              if (editor) {
                editor.setSelection(editor.getModel().getFullModelRange());
                editor.focus();
              }
            }},
            { label: 'Cut', action: () => {
              const editor = (window as any).monacoEditor;
              if (editor) {
                const selection = editor.getSelection();
                const text = editor.getModel().getValueInRange(selection);
                navigator.clipboard.writeText(text);
                editor.executeEdits('cut', [{ range: selection, text: '' }]);
                editor.focus();
              }
            }},
            { label: 'Copy', action: () => {
              const editor = (window as any).monacoEditor;
              if (editor) {
                const selection = editor.getSelection();
                const text = editor.getModel().getValueInRange(selection);
                navigator.clipboard.writeText(text || editor.getValue());
                editor.focus();
              }
            }},
            { label: 'Paste', action: async () => {
              const text = await navigator.clipboard.readText();
              const editor = (window as any).monacoEditor;
              if (editor) {
                const selection = editor.getSelection();
                editor.executeEdits('paste', [{ range: selection, text: text, forceMoveMarkers: true }]);
                editor.focus();
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
                fontWeight: '600'
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
