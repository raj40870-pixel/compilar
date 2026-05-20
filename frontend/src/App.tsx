import { useState, useRef, useEffect, useCallback } from 'react';
import Editor from './components/Editor';
import MyTerminal from './Terminal';
import CustomSelect from './components/CustomSelect';
import { Download, Monitor, Copy, CheckCheck, Play, Square } from 'lucide-react';

const LANGUAGES = [
  { id: 'c', name: 'C', version: 'GCC 13' },
  { id: 'cpp', name: 'C++', version: 'G++ 13' },
  { id: 'python', name: 'Python', version: '3.12' },
  { id: 'java', name: 'Java', version: 'JDK 21' },
  { id: 'javascript', name: 'JavaScript', version: 'Node 20' },
  { id: 'typescript', name: 'TypeScript', version: 'Node 20' },
  { id: 'csharp', name: 'C#', version: '.NET 4.8' },
];

const EXT: Record<string, string> = { 
  c: 'c', 
  cpp: 'cpp', 
  python: 'py', 
  java: 'java', 
  javascript: 'js',
  typescript: 'ts',
  csharp: 'cs'
};

const DEFAULT_CODE: Record<string, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}',
  python: 'print("Hello World")',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
  javascript: 'console.log("Hello World");',
  typescript: 'const add = (a: number, b: number): number => a + b;\nconsole.log("TypeScript Sum:", add(10, 20));',
  csharp: 'using System;\n\npublic class Program {\n    public static void Main() {\n        Console.WriteLine("Hello from C#!");\n    }\n}',
};

function App() {
  const [language, setLanguage] = useState(LANGUAGES[4]);
  const [code, setCode] = useState(DEFAULT_CODE[LANGUAGES[4].id]);
  const [terminalOutput, setTerminalOutput] = useState<{ text: string; id: number }>({ text: '', id: 0 });
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal'>('editor');
  const [copyDone, setCopyDone] = useState(false);

  // Accumulate raw terminal text for the Copy Output button
  const rawOutputRef = useRef<string>('');

  const wsRef = useRef<WebSocket | null>(null);

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
    rawOutputRef.current = '';
    setCopyDone(false);

    // Clear terminal screen and move cursor home
    writeToTerminal('\x1b[2J\x1b[H');

    // Auto switch to terminal tab on mobile
    if (window.innerWidth <= 1024) {
      setActiveTab('terminal');
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws/run';

    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const connectionTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        writeToTerminal('\r\n\x1b[31mError: Cannot connect to backend.\x1b[0m\r\n');
        writeToTerminal('\x1b[90mMake sure the backend is running: cd backend && npm start\x1b[0m\r\n');
        setIsPending(false);
      }
    }, 5000);

    ws.onopen = () => {
      clearTimeout(connectionTimer);
      writeToTerminal('\x1b[2J\x1b[H');
      ws.send(JSON.stringify({ type: 'run', language: language.id, code }));
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'stdout') {
        rawOutputRef.current += payload.data;
        writeToTerminal(payload.data);
      } else if (payload.type === 'stderr') {
        rawOutputRef.current += payload.data;
        writeToTerminal(payload.data);
      } else if (payload.type === 'exit') {
        setIsPending(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      clearTimeout(connectionTimer);
    };

    ws.onclose = () => {
      clearTimeout(connectionTimer);
      if (wsRef.current === ws && isPending) {
        writeToTerminal('\r\n\x1b[31mConnection closed.\x1b[0m\r\n');
        setIsPending(false);
      }
    };
  };

  const handleTerminalInput = (data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stdin', data }));
    }
  };

  const handleLanguageChange = (langId: string) => {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (lang) {
      setLanguage(lang);
      setCode(DEFAULT_CODE[lang.id]);
    }
  };

  const handleDownload = () => {
    const ext = EXT[language.id] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Copy Output button ──────────────────────────────────────────
  const handleCopyOutput = useCallback(async () => {
    const text = rawOutputRef.current.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      // Fallback for older browsers / WebView
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

  const fileLabel = `main.${EXT[language.id] || language.id}`;

  return (
    <div className="app-root">
      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="navbar">
        {/* Left: language + RUN */}
        <div className="nav-group">
          <div className="lang-selector-group">
            <span className="lang-label">Language:</span>
            <CustomSelect
              options={LANGUAGES}
              value={language.id}
              onChange={handleLanguageChange}
            />
          </div>

          <button
            onClick={handleRun}
            className={`btn-run${isPending ? ' running' : ''}`}
            id="btn-run"
          >
            {isPending
              ? <><Square size={13} style={{ marginRight: 5 }} />STOP</>
              : <><Play size={13} style={{ marginRight: 5 }} />RUN</>}
          </button>
        </div>

        {/* Right: Download */}
        <div className="nav-group nav-right">
          <button onClick={handleDownload} className="btn-download" title="Download code">
            <Download size={16} />
            <span className="desktop-only">Download</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE TABS ────────────────────────────────────────── */}
      <div className="mobile-tabs">
        <button
          className={activeTab === 'editor' ? 'active' : ''}
          onClick={() => setActiveTab('editor')}
        >
          <Monitor size={14} style={{ marginRight: 4 }} />
          Editor
        </button>
        <button
          className={activeTab === 'terminal' ? 'active' : ''}
          onClick={() => setActiveTab('terminal')}
        >
          <span className="tab-icon">$</span>
          Terminal
          {isPending && <span className="tab-running-dot" />}
        </button>
      </div>

      {/* ── MAIN AREA ──────────────────────────────────────────── */}
      <main className="app-main">
        {/* EDITOR PANE */}
        <section className={`editor-section${activeTab !== 'editor' ? ' mobile-hidden' : ''}`}>
          <header className="section-header">
            <div className="header-label">
              <Monitor size={13} />
              <span>{fileLabel}</span>
            </div>
            <div className="header-label">
              <span>{language.version}</span>
            </div>
          </header>
          <div className="editor-body">
            <Editor
              language={language.id}
              code={code}
              onChange={(val) => setCode(val || '')}
            />
          </div>
        </section>

        {/* TERMINAL PANE */}
        <aside className={`sidebar-section${activeTab !== 'terminal' ? ' mobile-hidden' : ''}`}>
          <div className="output-area">
            <div className="output-header">
              <div className="output-header-left">
                <span className="output-header-dot" />
                <span>Terminal</span>
                {isPending && <span className="running-badge">RUNNING</span>}
              </div>
              <button
                className={`btn-copy-output${copyDone ? ' copied' : ''}`}
                onClick={handleCopyOutput}
                title="Copy terminal output"
              >
                {copyDone
                  ? <><CheckCheck size={14} /><span>Copied!</span></>
                  : <><Copy size={14} /><span>Copy</span></>}
              </button>
            </div>
            <div className="terminal-wrapper">
              <MyTerminal onInput={handleTerminalInput} output={terminalOutput} isPending={isPending} />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
