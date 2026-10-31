import { useState, useRef, useEffect, useCallback } from 'react';
import Editor from './components/Editor';
import MyTerminal from './Terminal';
import CustomSelect from './components/CustomSelect';
import { Download, Monitor, Copy, CheckCheck, Play, Square, Terminal as TerminalIcon, ChevronDown, ChevronUp } from 'lucide-react';

const LANGUAGES = [
  { id: 'c', name: 'C', version: 'GCC 13' },
  { id: 'cpp', name: 'C++', version: 'G++ 13' },
  { id: 'csharp', name: 'C#', version: '.NET 8' },
  { id: 'go', name: 'Go', version: '1.22' },
  { id: 'java', name: 'Java', version: 'JDK 21' },
  { id: 'javascript', name: 'JavaScript', version: 'Node 20' },
  { id: 'kotlin', name: 'Kotlin', version: '2.1' },
  { id: 'lua', name: 'Lua', version: '5.4' },
  { id: 'php', name: 'PHP', version: '8.2' },
  { id: 'python', name: 'Python', version: '3.12' },
  { id: 'rust', name: 'Rust', version: '1.75' },
  { id: 'bash', name: 'Bash', version: '5.2' },
  { id: 'typescript', name: 'TypeScript', version: 'Node 20' },
  { id: 'ruby', name: 'Ruby', version: '3.1' },
];

const FILE_NAMES: Record<string, string> = {
  c: 'main.c',
  cpp: 'main.cpp',
  csharp: 'main.cs',
  go: 'main.go',
  java: 'Main.java',
  javascript: 'Main.js',
  kotlin: 'main.kt',
  lua: 'main.lua',
  php: 'main.php',
  python: 'main.py',
  rust: 'main.rs',
  bash: 'main.sh',
  typescript: 'main.ts',
  ruby: 'main.rb',
};

const EXT: Record<string, string> = { 
  c: 'c', cpp: 'cpp', csharp: 'cs', go: 'go', java: 'java',
  javascript: 'js', kotlin: 'kt', lua: 'lua', php: 'php',
  python: 'py', rust: 'rs', bash: 'sh', typescript: 'ts',
  ruby: 'rb'
};

const DEFAULT_CODE: Record<string, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}',
  csharp: 'using System;\n\npublic class Program {\n    public static void Main() {\n        Console.WriteLine("Hello World");\n    }\n}',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World");\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
  javascript: 'console.log("Hello World");',
  kotlin: 'fun main() {\n    println("Hello World")\n}',
  lua: 'print("Hello World")',
  php: '<?php\n\necho "Hello World\\n";',
  python: 'print("Hello World")',
  rust: 'fn main() {\n    println!("Hello World");\n}',
  bash: 'echo "Hello World"',
  typescript: 'const message: string = "Hello World";\nconsole.log(message);',
  ruby: 'puts "Hello World"',
};

function App() {
  const [language, setLanguage] = useState(() => {
    try {
      const savedId = sessionStorage.getItem('compilar_session_lang');
      if (savedId) {
        const found = LANGUAGES.find(l => l.id === savedId);
        if (found) return found;
      }
    } catch {}
    return LANGUAGES[1]; // Default to C++
  });

  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    try {
      // Clear legacy localStorage so fresh browser visits always reset to default Hello World
      localStorage.removeItem('compilar_codes_v1');
      localStorage.removeItem('compilar_language_v1');
      localStorage.removeItem('compilar_web_files_v3');
      localStorage.removeItem('compilar_active_web_file_v3');
      localStorage.removeItem('compilar_open_web_files_v3');

      // sessionStorage preserves edits only while the user's tab/session is open
      const savedSession = sessionStorage.getItem('compilar_session_codes');
      if (savedSession) {
        return { ...DEFAULT_CODE, ...JSON.parse(savedSession) };
      }
    } catch {}
    return { ...DEFAULT_CODE };
  });

  const code = codeMap[language.id] !== undefined ? codeMap[language.id] : (DEFAULT_CODE[language.id] || '');

  const setCode = (newCode: string) => {
    setCodeMap(prev => {
      const next = { ...prev, [language.id]: newCode };
      try {
        sessionStorage.setItem('compilar_session_codes', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleLanguageChange = (langId: string) => {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (lang) {
      setLanguage(lang);
      try {
        sessionStorage.setItem('compilar_session_lang', lang.id);
      } catch {}
    }
  };

  const [terminalOutput, setTerminalOutput] = useState<{ text: string; id: number }>({ text: '', id: 0 });
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal'>('editor');
  const [copyDone, setCopyDone] = useState(false);
  const [stdinValue, setStdinValue] = useState('');
  const [stdinOpen, setStdinOpen] = useState(false);

  const rawOutputRef = useRef<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  const writeToTerminal = (text: string) => {
    setTerminalOutput({ text, id: Date.now() + Math.random() });
  };

  const handleRun = () => {
    if (isPending) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stop' }));
      }
      return;
    }

    setIsPending(true);
    isPendingRef.current = true;
    rawOutputRef.current = '';
    setCopyDone(false);

    writeToTerminal('\x1b[2J\x1b[H');

    if (window.innerWidth <= 1024) setActiveTab('terminal');

    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'https://compiler-backend-1-2y9m.onrender.com';
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws/run';

    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const connectionTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        writeToTerminal('\r\n\x1b[31mError: Cannot connect to backend.\x1b[0m\r\n');
        writeToTerminal('\x1b[90mThe backend might be sleeping or unreachable. Please try again in a few seconds.\x1b[0m\r\n');
        setIsPending(false);
        isPendingRef.current = false;
      }
    }, 60000); // 60 seconds for Render cold starts

    ws.onopen = () => {
      clearTimeout(connectionTimer);
      writeToTerminal('\x1b[2J\x1b[H');
      ws.send(JSON.stringify({ type: 'run', language: language.id, code }));
      if (stdinValue.trim()) {
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const lines = stdinValue.endsWith('\n') ? stdinValue : stdinValue + '\n';
            ws.send(JSON.stringify({ type: 'stdin', data: lines }));
          }
        }, 200);
      }
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'stdout' || payload.type === 'stderr') {
        rawOutputRef.current += payload.data;
        writeToTerminal(payload.data);
      } else if (payload.type === 'exit') {
        setIsPending(false);
        isPendingRef.current = false;
        ws.close();
      }
    };

    ws.onerror = () => clearTimeout(connectionTimer);
    ws.onclose = () => {
      clearTimeout(connectionTimer);
      if (wsRef.current === ws && isPendingRef.current) {
        writeToTerminal('\r\n\x1b[31mConnection closed.\x1b[0m\r\n');
        setIsPending(false);
        isPendingRef.current = false;
      }
    };
  };

  const handleTerminalInput = (data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stdin', data }));
    }
  };

  const handleCodeChange = (val: string | undefined) => {
    setCode(val || '');
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyOutput = useCallback(async () => {
    const text = rawOutputRef.current.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }, []);

  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  const getDynamicFileName = (langId: string, currentCode: string): string => {
    if (langId === 'java') {
      const publicMatch = currentCode.match(/public\s+(?:class|record|interface|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
      if (publicMatch && publicMatch[1]) return `${publicMatch[1]}.java`;

      const mainClassMatch = currentCode.match(/class\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\{[^}]*static\s+void\s+main/s);
      if (mainClassMatch && mainClassMatch[1]) return `${mainClassMatch[1]}.java`;

      const anyClassMatch = currentCode.match(/(?:class|record|interface|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
      if (anyClassMatch && anyClassMatch[1]) return `${anyClassMatch[1]}.java`;

      return 'Main.java';
    }

    if (langId === 'csharp') {
      const match = currentCode.match(/(?:public\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
      if (match && match[1]) return `${match[1]}.cs`;
      return 'main.cs';
    }

    return FILE_NAMES[langId] || `main.${EXT[langId] || 'txt'}`;
  };

  const currentFileName = getDynamicFileName(language.id, code);

  return (
    <div className="app-root">
      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="nav-brand">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="7" fill="#863bff"/>
            <path d="M9 11L5 16L9 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 11L27 16L23 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 8L13 24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="nav-brand-name">Compilar</span>
        </div>
        
        <div className="nav-group">
          <div className="lang-selector-group">
            <span className="lang-label">Language:</span>
            <CustomSelect options={LANGUAGES} value={language.id} onChange={handleLanguageChange} />
          </div>

          <button onClick={handleRun} className={`btn-run${isPending ? ' running' : ''}`}>
            {isPending
              ? <><Square size={13} style={{ marginRight: 5 }} />STOP</>
              : <><Play size={13} style={{ marginRight: 5 }} />RUN</>}
          </button>
        </div>

        <div className="nav-group nav-right">
          <button onClick={handleDownload} className="btn-download" title={`Download ${currentFileName}`}>
            <Download size={16} />
            <span className="desktop-only">Download</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE TABS ── */}
      <div className="mobile-tabs">
        <button className={activeTab === 'editor' ? 'active' : ''} onClick={() => setActiveTab('editor')}>
          <Monitor size={14} style={{ marginRight: 4 }} /> Editor
        </button>
        <button className={activeTab === 'terminal' ? 'active' : ''} onClick={() => setActiveTab('terminal')}>
          <span className="tab-icon">$</span> Terminal
          {isPending && <span className="tab-running-dot" />}
        </button>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <main className="app-main">
        <section className={`editor-section${activeTab !== 'editor' ? ' mobile-hidden' : ''}`}>
          <header className="section-header">
            <div className="header-label">
              <Monitor size={13} />
              <span>{currentFileName}</span>
            </div>
            <div className="header-label">
              <span>{language.version}</span>
            </div>
          </header>
          <div className="editor-body">
            <Editor
              language={language.id}
              code={code}
              onChange={handleCodeChange}
            />
          </div>
        </section>

        <aside className={`sidebar-section${activeTab !== 'terminal' ? ' mobile-hidden' : ''}`}>
          <div className="stdin-panel">
            <button className="stdin-toggle" onClick={() => setStdinOpen(o => !o)} title="Provide stdin input for your program">
              <TerminalIcon size={13} />
              <span>Program Input (stdin)</span>
              {stdinValue.trim() && <span className="stdin-dot" />}
              {stdinOpen ? <ChevronUp size={13} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={13} style={{ marginLeft: 'auto' }} />}
            </button>
            {stdinOpen && (
              <textarea
                className="stdin-textarea"
                placeholder="Enter input for your program here, each value on a new line…"
                value={stdinValue}
                onChange={e => setStdinValue(e.target.value)}
                spellCheck={false}
              />
            )}
          </div>

          <div className="output-area">
            <div className="output-header">
              <div className="output-header-left">
                <span className="output-header-dot" />
                <span>Terminal</span>
                {isPending && <span className="running-badge">RUNNING</span>}
              </div>
              <button className={`btn-copy-output${copyDone ? ' copied' : ''}`} onClick={handleCopyOutput} title="Copy terminal output">
                {copyDone ? <><CheckCheck size={14} /><span>Copied!</span></> : <><Copy size={14} /><span>Copy</span></>}
              </button>
            </div>
            <div className="terminal-wrapper" style={{ background: '#1e1e1e' }}>
              <MyTerminal onInput={handleTerminalInput} output={terminalOutput} isPending={isPending} />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
