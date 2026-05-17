import { useState, useRef, useEffect, useCallback } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { LANGUAGE_COMPLETIONS } from '../utils/completionData';

interface EditorProps {
  language: string;
  code: string;
  onChange: (value: string | undefined) => void;
}

interface HandlePos { x: number; y: number; line: number; col: number; }
interface MenuState { visible: boolean; y: number; x: number; hasSelection: boolean; }
interface SelectionHandles {
  start: HandlePos | null;
  end: HandlePos | null;
  visible: boolean;
}

const HANDLE_SIZE = 22; // px — diameter of the circular drag handle

const Editor = ({ language, code, onChange }: EditorProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [menu, setMenu] = useState<MenuState>({ visible: false, y: 0, x: 0, hasSelection: false });
  const [handles, setHandles] = useState<SelectionHandles>({ start: null, end: null, visible: false });
  const [isDraggingActive, setIsDraggingActive] = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const draggingHandle = useRef<'start' | 'end' | null>(null);
  const selChangeDisposer = useRef<any>(null);

  // ── helpers ──────────────────────────────────────────────────────
  const isMobileDevice = () => window.matchMedia('(max-width: 768px)').matches;

  const getMonacoLanguage = (lang: string) => {
    const map: Record<string, string> = {
      c: 'c', cpp: 'cpp', java: 'java', javascript: 'javascript', python: 'python',
    };
    return map[lang] ?? 'javascript';
  };

  useEffect(() => {
    const update = () => setIsMobile(isMobileDevice());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Global click outside handler ─────────────────────────────────
  useEffect(() => {
    if (!menu.visible) return;

    const handleOutsideClick = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // Close only if click is outside the editor component entirely
      if (containerRef.current && !containerRef.current.contains(target)) {
        closeMenu();
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [menu.visible]);

  // ── Convert Monaco position → screen pixel ───────────────────────
  const monacoPositionToPixel = (editor: any, position: { lineNumber: number; column: number }) => {
    try {
      const pos = editor.getScrolledVisiblePosition(position);
      if (!pos) return null;
      const domNode = editor.getDomNode() as HTMLElement;
      if (!domNode) return null;
      const rect = domNode.getBoundingClientRect();
      return { x: rect.left + pos.left, y: rect.top + pos.top };
    } catch {
      return null;
    }
  };

  // ── Convert screen pixel → Monaco position ───────────────────────
  const pixelToMonacoPosition = (editor: any, clientX: number, clientY: number) => {
    try {
      const target = editor.getTargetAtClientPoint(clientX, clientY);
      return target?.position ?? null;
    } catch {
      return null;
    }
  };

  // ── Show and position menu popup relative to selection end ───────
  const showPopupMenu = (editor: any) => {
    const sel = editor.getSelection();
    if (sel && !sel.isEmpty()) {
      const endPx = monacoPositionToPixel(editor, { lineNumber: sel.endLineNumber, column: sel.endColumn });
      if (endPx) {
        // Show below-right of the selection end caret
        const x = Math.max(10, Math.min(window.innerWidth - 240, endPx.x - 20));
        const y = Math.max(60, endPx.y + 35);
        setMenu({ visible: true, y, x, hasSelection: true });
      }
    } else {
      closeMenu();
    }
  };

  // ── Refresh handle positions from current Monaco selection ────────
  const refreshHandles = useCallback((editor: any) => {
    if (!isMobileDevice()) { setHandles({ start: null, end: null, visible: false }); return; }
    const sel = editor.getSelection();
    
    // Hide handles if selection is empty
    if (!sel || sel.isEmpty()) {
      setHandles({ start: null, end: null, visible: false });
      return;
    }

    const startPx = monacoPositionToPixel(editor, { lineNumber: sel.startLineNumber, column: sel.startColumn });
    const endPx   = monacoPositionToPixel(editor, { lineNumber: sel.endLineNumber,   column: sel.endColumn   });

    setHandles({
      start: startPx ? { x: startPx.x, y: startPx.y, line: sel.startLineNumber, col: sel.startColumn } : null,
      end:   endPx   ? { x: endPx.x,   y: endPx.y,   line: sel.endLineNumber,   col: sel.endColumn   } : null,
      visible: !!(startPx && endPx),
    });
  }, []);

  // ── Mobile key-bar insert ─────────────────────────────────────────
  const MOBILE_INSERTS: Record<string, string> = {
    Tab: '\t', '{}': '{}', '()': '()', '[]': '[]', '<>': '<>',
    '""': '""', "''": "''", ';': ';', '=': '=', '+': '+', '-': '-',
    '!': '!', '$': '$', '&': '&', '#': '#', '%': '%', '|': '|',
    '^': '^', '\\': '\\', '/': '/', '.': '.', ',': ',',
    '<': '<', '>': '>', '←': '←', '↑': '↑', '↓': '↓', '→': '→',
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
      editor.setPosition({ lineNumber: position.lineNumber, column: position.column - (insertText.length / 2) });
    }
    editor.focus();
  };

  // ── Monaco mount ─────────────────────────────────────────────────
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Theme
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: {
        'editor.background':            '#0d0d0f',
        'editorCursor.foreground':      '#ffffff',
        'editor.selectionBackground':   '#3a4f6e',
        'editor.lineHighlightBackground': '#1a1a1d',
        'editor.selectionHighlightBackground': '#2a3f5e',
      }
    });
    monaco.editor.setTheme('custom-dark');

    // Completions
    if (!(monaco as any).__completionsRegistered) {
      Object.entries(LANGUAGE_COMPLETIONS).forEach(([lang, items]) => {
        monaco.languages.registerCompletionItemProvider(lang, {
          provideCompletionItems: (model: any, position: any) => {
            const word = model.getWordUntilPosition(position);
            const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
            return { suggestions: items.map(item => ({ label: item.label, kind: item.kind, insertText: item.insertText, detail: item.detail, documentation: item.documentation, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range })) };
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

    // Hide Monaco's own keyboard button
    const hideKeyboardBtn = () => {
      document.querySelectorAll('.showKeyboardButton, .show-keyboard-button, [class*="keyboard"][class*="button"]')
        .forEach(el => ((el as HTMLElement).style.display = 'none'));
    };
    hideKeyboardBtn();
    setTimeout(hideKeyboardBtn, 500);
    setTimeout(hideKeyboardBtn, 1500);

    (window as any).monacoEditor = editor;

    // ── Selection change → update handles ──────────────────────────
    if (selChangeDisposer.current) selChangeDisposer.current.dispose();
    selChangeDisposer.current = editor.onDidChangeCursorSelection(() => {
      if (isMobileDevice() && !draggingHandle.current) {
        refreshHandles(editor);
      }
    });

    // ── Mobile trigger on pointerup ────────────────────────────────
    const container = containerRef.current;
    if (!container || (container as any).__touchAdded) return;
    (container as any).__touchAdded = true;

    container.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse') return;
      if ((e.target as HTMLElement).closest?.('.sel-handle, .editor-context-menu')) return;

      // Small timeout to let Monaco resolve text selection state
      setTimeout(() => {
        showPopupMenu(editor);
        refreshHandles(editor);
      }, 80);
    }, { passive: true });

    container.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  // ── Drag Selection Helpers ────────────────────────────────────────
  const isPosGreater = (p1: { lineNumber: number; column: number }, p2: { lineNumber: number; column: number }) => {
    if (p1.lineNumber > p2.lineNumber) return true;
    if (p1.lineNumber === p2.lineNumber && p1.column > p2.column) return true;
    return false;
  };

  const onHandlePointerDown = (e: React.PointerEvent, which: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    draggingHandle.current = which;
    setIsDraggingActive(true); 

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const editor = (window as any).monacoEditor;
      if (!editor) return;

      const pos = pixelToMonacoPosition(editor, moveEvent.clientX, moveEvent.clientY);
      if (!pos) return;
      const sel = editor.getSelection();
      if (!sel) return;

      let newSel;
      if (which === 'start') {
        let effectivePos = pos;
        if (isPosGreater(pos, { lineNumber: sel.endLineNumber, column: sel.endColumn })) {
          effectivePos = { lineNumber: sel.endLineNumber, column: sel.endColumn };
        }
        newSel = {
          startLineNumber: effectivePos.lineNumber, startColumn: effectivePos.column,
          endLineNumber:   sel.endLineNumber,       endColumn:   sel.endColumn,
        };
      } else {
        let effectivePos = pos;
        if (isPosGreater({ lineNumber: sel.startLineNumber, column: sel.startColumn }, pos)) {
          effectivePos = { lineNumber: sel.startLineNumber, column: sel.startColumn };
        }
        newSel = {
          startLineNumber: sel.startLineNumber,       startColumn: sel.startColumn,
          endLineNumber:   effectivePos.lineNumber, endColumn:   effectivePos.column,
        };
      }
      editor.setSelection(newSel);
      refreshHandles(editor);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      draggingHandle.current = null;
      setIsDraggingActive(false);
      const editor = (window as any).monacoEditor;
      if (editor) {
        showPopupMenu(editor); // Show popup when drag ends
        refreshHandles(editor);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // ── Robust Clipboard Copy Fallback ────────────────────────────────
  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.top = '0';
    ta.style.left = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(ta);
  };

  // ── Context menu actions ──────────────────────────────────────────
  const closeMenu = () => {
    setMenu({ visible: false, y: 0, x: 0, hasSelection: false });
    setHandles({ start: null, end: null, visible: false });
  };

  const TOOLBAR_ITEMS = [
    {
      label: 'Select All',
      action: () => {
        const ed = (window as any).monacoEditor;
        if (!ed) return;
        ed.setSelection(ed.getModel().getFullModelRange());
        ed.focus();
        closeMenu(); // immediate close
      },
    },
    {
      label: 'Cut',
      action: () => {
        const ed = (window as any).monacoEditor;
        if (ed) {
          const sel = ed.getSelection();
          const text = ed.getModel().getValueInRange(sel);
          if (text) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
            } else {
              fallbackCopy(text);
            }
            ed.executeEdits('cut', [{ range: sel, text: '' }]);
          }
          ed.focus();
        }
        closeMenu(); // immediate close
      },
    },
    {
      label: 'Copy',
      action: () => {
        const ed = (window as any).monacoEditor;
        if (ed) {
          const sel = ed.getSelection();
          const text = ed.getModel().getValueInRange(sel) || ed.getValue();
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
          } else {
            fallbackCopy(text);
          }
          ed.focus();
        }
        closeMenu(); // immediate close
      },
    },
    {
      label: 'Paste',
      action: async () => {
        const ed = (window as any).monacoEditor;
        if (ed) {
          try {
            const text = await navigator.clipboard.readText();
            const sel = ed.getSelection();
            ed.executeEdits('paste', [{ range: sel, text }]);
          } catch (_) {
            const text = prompt("Paste text here:");
            if (text) {
              const sel = ed.getSelection();
              ed.executeEdits('paste', [{ range: sel, text }]);
            }
          }
          ed.focus();
        }
        closeMenu(); // immediate close
      },
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`editor-container${isMobile ? ' mobile-with-bar' : ''}`}
      style={{ height: '100%', width: '100%', position: 'relative', paddingBottom: isMobile ? '58px' : undefined }}
    >
      <MonacoEditor
        height={isMobile ? 'calc(100% - 58px)' : '100%'}
        language={getMonacoLanguage(language)}
        value={code}
        theme="custom-dark"
        onChange={onChange}
        onMount={handleEditorDidMount}
      />

      {/* ── CONTEXT MENU ─────────────────────────────────────────── */}
      {menu.visible && (
        <div
          className="editor-context-menu"
          style={{
            top: menu.y,
            left: menu.x,
            transform: 'none', // Align directly to target coordinate
            pointerEvents: isDraggingActive ? 'none' : 'auto'
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="ctx-actions-row">
            {TOOLBAR_ITEMS.map((item, idx) => (
              <div key={item.label} className="ctx-item-wrap">
                <button
                  className="ctx-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    item.action();
                  }}
                >
                  {item.label}
                </button>
                {idx < TOOLBAR_ITEMS.length - 1 && <div className="ctx-divider" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SELECTION HANDLES ────────────────────────────────────── */}
      {handles.visible && handles.start && (
        <div
          className="sel-handle sel-handle-start"
          style={{
            left: handles.start.x - HANDLE_SIZE / 2,
            top: handles.start.y,
            pointerEvents: isDraggingActive ? 'none' : 'auto'
          }}
          onPointerDown={(e) => onHandlePointerDown(e, 'start')}
        >
          <div className="sel-handle-line" />
          <div className="sel-handle-circle" />
        </div>
      )}
      {handles.visible && handles.end && (
        <div
          className="sel-handle sel-handle-end"
          style={{
            left: handles.end.x - HANDLE_SIZE / 2,
            top: handles.end.y,
            pointerEvents: isDraggingActive ? 'none' : 'auto'
          }}
          onPointerDown={(e) => onHandlePointerDown(e, 'end')}
        >
          <div className="sel-handle-line" />
          <div className="sel-handle-circle" />
        </div>
      )}

      {/* ── MOBILE KEY BAR ───────────────────────────────────────── */}
      {isMobile && (
        <div className="mobile-keybar">
          {['Tab','{}','()','[]','<>','""',"''",' ;','=','+','-','!','$','&','#','%','|','^','\\','/','.',',' ].map((key) => (
            <button
              key={key}
              onClick={() => insertMobileText(key.trim())}
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
