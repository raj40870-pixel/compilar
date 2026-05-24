import { useState, useRef, useEffect, useCallback } from 'react';
import Editor from './components/Editor';
import MyTerminal from './Terminal';
import CustomSelect from './components/CustomSelect';
import FileExplorer, { type FileNode } from './components/FileExplorer';
import { Download, Monitor, Copy, CheckCheck, Play, Square, Terminal as TerminalIcon, ChevronDown, ChevronUp, Globe, Folder, X, FileCode, File, Sidebar } from 'lucide-react';

const LANGUAGES = [
  { id: 'c', name: 'C', version: 'GCC 13' },
  { id: 'cpp', name: 'C++', version: 'G++ 13' },
  { id: 'python', name: 'Python', version: '3.12' },
  { id: 'java', name: 'Java', version: 'JDK 21' },
  { id: 'javascript', name: 'JavaScript', version: 'Node 20' },
  { id: 'typescript', name: 'TypeScript', version: 'Node 20' },
  { id: 'csharp', name: 'C#', version: '.NET 8' },
  { id: 'go', name: 'Go', version: '1.21' },
  { id: 'php', name: 'PHP', version: '8.2' },
  { id: 'rust', name: 'Rust', version: '1.75' },
  { id: 'web', name: 'Web Compiler', version: 'HTML/CSS/JS' },
];

const EXT: Record<string, string> = { 
  c: 'c', cpp: 'cpp', python: 'py', java: 'java', javascript: 'js',
  typescript: 'ts', csharp: 'cs', go: 'go', php: 'php', rust: 'rs', web: 'html'
};

const DEFAULT_CODE: Record<string, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}',
  python: 'print("Hello World")',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
  javascript: 'console.log("Hello World");',
  typescript: 'const add = (a: number, b: number): number => a + b;\nconsole.log("TypeScript Sum:", add(10, 20));',
  csharp: 'using System;\n\npublic class Program {\n    public static void Main() {\n        Console.WriteLine("Hello from C#!");\n    }\n}',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World")\n}',
  php: '<?php\n\necho "Hello World\\n";',
  rust: 'fn main() {\n    println!("Hello World");\n}',
};

const DEFAULT_WEB_FILES: FileNode[] = [
  { 
    id: 'index.html', 
    name: 'index.html', 
    type: 'file', 
    content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Modern Developer Portfolio</title>\n  <link rel="stylesheet" href="style.css">\n  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">\n</head>\n<body>\n  <div class="background-mesh"></div>\n  <nav class="navbar">\n    <div class="logo">Dev<span>Pro</span></div>\n    <ul class="nav-links">\n      <li><a href="#home">Home</a></li>\n      <li><a href="#projects">Projects</a></li>\n      <li><a href="#contact">Contact</a></li>\n    </ul>\n    <button id="theme-toggle" class="btn-theme">🌙</button>\n  </nav>\n\n  <main class="hero">\n    <div class="hero-content">\n      <span class="badge">Available for hire</span>\n      <h1 class="glitch" data-text="Creative Developer">Creative Developer</h1>\n      <p class="subtitle">I build interactive web experiences using <span id="typing-text"></span><span class="cursor">|</span></p>\n      <div class="cta-group">\n        <button class="btn-primary" onclick="alert('Welcome to your new workspace!')">Start Building</button>\n        <button class="btn-secondary">View Work</button>\n      </div>\n    </div>\n    \n    <div class="glass-card">\n      <div class="card-header">\n        <span class="dot red"></span>\n        <span class="dot yellow"></span>\n        <span class="dot green"></span>\n      </div>\n      <div class="card-body">\n        <pre><code>const developer = {\n  name: "Your Name",\n  skills: ["HTML5", "CSS3", "JavaScript"],\n  passion: "Building the future",\n  status: "Coding..."\n};</code></pre>\n      </div>\n    </div>\n  </main>\n  \n  <script src="script.js"></script>\n</body>\n</html>`, 
    parentId: null 
  },
  { 
    id: 'style.css', 
    name: 'style.css', 
    type: 'file', 
    content: `:root {\n  --bg: #0f172a;\n  --text: #f8fafc;\n  --accent: #8b5cf6;\n  --glass: rgba(255, 255, 255, 0.05);\n  --glass-border: rgba(255, 255, 255, 0.1);\n}\n\n.light-mode {\n  --bg: #f8fafc;\n  --text: #0f172a;\n  --accent: #6d28d9;\n  --glass: rgba(0, 0, 0, 0.05);\n  --glass-border: rgba(0, 0, 0, 0.1);\n}\n\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n  font-family: 'Inter', sans-serif;\n  transition: background-color 0.3s ease, color 0.3s ease;\n}\n\nbody {\n  background-color: var(--bg);\n  color: var(--text);\n  min-height: 100vh;\n  overflow-x: hidden;\n}\n\n/* Abstract Background Mesh */\n.background-mesh {\n  position: fixed;\n  top: 0; left: 0; width: 100vw; height: 100vh;\n  z-index: -1;\n  background-image: \n    radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),\n    radial-gradient(at 100% 100%, rgba(56, 189, 248, 0.15) 0px, transparent 50%);\n  filter: blur(100px);\n}\n\n/* Navbar */\n.navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 1.5rem 5%;\n  backdrop-filter: blur(10px);\n  border-bottom: 1px solid var(--glass-border);\n}\n\n.logo {\n  font-size: 1.5rem;\n  font-weight: 800;\n  letter-spacing: -1px;\n}\n.logo span { color: var(--accent); }\n\n.nav-links {\n  display: flex;\n  list-style: none;\n  gap: 2rem;\n}\n.nav-links a {\n  color: var(--text);\n  text-decoration: none;\n  font-weight: 600;\n  font-size: 0.9rem;\n  opacity: 0.8;\n  transition: 0.2s;\n}\n.nav-links a:hover { opacity: 1; color: var(--accent); }\n\n.btn-theme {\n  background: var(--glass);\n  border: 1px solid var(--glass-border);\n  padding: 8px 12px;\n  border-radius: 8px;\n  cursor: pointer;\n  font-size: 1.2rem;\n}\n\n/* Hero Section */\n.hero {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 5rem 5%;\n  gap: 4rem;\n  min-height: calc(100vh - 80px);\n}\n\n.hero-content { flex: 1; }\n\n.badge {\n  display: inline-block;\n  padding: 6px 12px;\n  background: var(--glass);\n  border: 1px solid var(--glass-border);\n  border-radius: 20px;\n  font-size: 0.8rem;\n  font-weight: 600;\n  color: var(--accent);\n  margin-bottom: 1.5rem;\n  animation: slideDown 0.5s ease-out;\n}\n\n.glitch {\n  font-size: 4rem;\n  font-weight: 800;\n  line-height: 1.1;\n  margin-bottom: 1rem;\n  background: linear-gradient(to right, var(--text), var(--accent));\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}\n\n.subtitle {\n  font-size: 1.2rem;\n  opacity: 0.8;\n  margin-bottom: 2.5rem;\n  font-weight: 300;\n}\n\n.cursor { animation: blink 1s infinite; font-weight: bold; }\n\n/* Buttons */\n.cta-group { display: flex; gap: 1rem; }\n\n.btn-primary {\n  background: var(--accent);\n  color: #fff;\n  border: none;\n  padding: 12px 24px;\n  border-radius: 8px;\n  font-size: 1rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: transform 0.2s, box-shadow 0.2s;\n}\n.btn-primary:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);\n}\n\n.btn-secondary {\n  background: transparent;\n  color: var(--text);\n  border: 1px solid var(--glass-border);\n  padding: 12px 24px;\n  border-radius: 8px;\n  font-size: 1rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n.btn-secondary:hover { background: var(--glass); }\n\n/* Glass Code Card */\n.glass-card {\n  flex: 1;\n  background: var(--glass);\n  border: 1px solid var(--glass-border);\n  border-radius: 16px;\n  padding: 1.5rem;\n  backdrop-filter: blur(20px);\n  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);\n  animation: float 6s ease-in-out infinite;\n}\n\n.card-header { display: flex; gap: 8px; margin-bottom: 1rem; }\n.dot { width: 12px; height: 12px; border-radius: 50%; }\n.dot.red { background: #ff5f56; }\n.dot.yellow { background: #ffbd2e; }\n.dot.green { background: #27c93f; }\n\npre {\n  color: #a78bfa;\n  font-family: monospace;\n  font-size: 0.95rem;\n  line-height: 1.5;\n  overflow-x: auto;\n}\n\n/* Animations */\n@keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }\n@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }\n@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }\n\n/* Responsive */\n@media (max-width: 768px) {\n  .hero { flex-direction: column; padding-top: 2rem; text-align: center; }\n  .glitch { font-size: 2.5rem; }\n  .nav-links { display: none; }\n  .cta-group { justify-content: center; }\n}\n`, 
    parentId: null 
  },
  { 
    id: 'script.js', 
    name: 'script.js', 
    type: 'file', 
    content: `// Theme Toggle functionality\nconst themeToggle = document.getElementById('theme-toggle');\nlet isDark = true;\n\nthemeToggle.addEventListener('click', () => {\n  document.body.classList.toggle('light-mode');\n  isDark = !isDark;\n  themeToggle.textContent = isDark ? '🌙' : '☀️';\n});\n\n// Typing Effect\nconst words = ["HTML5", "CSS3", "JavaScript", "React", "Node.js"];\nconst textElement = document.getElementById("typing-text");\nlet wordIndex = 0;\nlet charIndex = 0;\nlet isDeleting = false;\n\nfunction typeEffect() {\n  const currentWord = words[wordIndex];\n  \n  if (isDeleting) {\n    textElement.textContent = currentWord.substring(0, charIndex - 1);\n    charIndex--;\n  } else {\n    textElement.textContent = currentWord.substring(0, charIndex + 1);\n    charIndex++;\n  }\n  \n  let typingSpeed = isDeleting ? 50 : 100;\n  \n  if (!isDeleting && charIndex === currentWord.length) {\n    typingSpeed = 2000; // Pause at end of word\n    isDeleting = true;\n  } else if (isDeleting && charIndex === 0) {\n    isDeleting = false;\n    wordIndex = (wordIndex + 1) % words.length;\n    typingSpeed = 500; // Pause before new word\n  }\n  \n  setTimeout(typeEffect, typingSpeed);\n}\n\n// Start typing effect\nsetTimeout(typeEffect, 1000);\n\n// Add 3D tilt effect to glass card\nconst card = document.querySelector('.glass-card');\ndocument.addEventListener('mousemove', (e) => {\n  if (window.innerWidth < 768) return; // Disable on mobile\n  \n  const xAxis = (window.innerWidth / 2 - e.pageX) / 25;\n  const yAxis = (window.innerHeight / 2 - e.pageY) / 25;\n  card.style.transform = \`rotateY(\${xAxis}deg) rotateX(\${yAxis}deg)\`;\n});\n\n// Reset tilt on mouse leave\ndocument.addEventListener('mouseleave', () => {\n  card.style.transform = \`rotateY(0deg) rotateX(0deg)\`;\n});`, 
    parentId: null 
  }
];

function App() {
  const [language, setLanguage] = useState(LANGUAGES[4]); // default to JS
  const [code, setCode] = useState(DEFAULT_CODE[LANGUAGES[4].id]);
  const [terminalOutput, setTerminalOutput] = useState<{ text: string; id: number }>({ text: '', id: 0 });
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'editor' | 'terminal'>('editor');
  const [copyDone, setCopyDone] = useState(false);
  const [stdinValue, setStdinValue] = useState('');
  const [stdinOpen, setStdinOpen] = useState(false);

  // Web Compiler States
  const [webFiles, setWebFiles] = useState<FileNode[]>(() => {
    try {
      const saved = localStorage.getItem('compilar_web_files_v2');
      return saved ? JSON.parse(saved) : DEFAULT_WEB_FILES;
    } catch {
      return DEFAULT_WEB_FILES;
    }
  });
  const [activeWebFileId, setActiveWebFileId] = useState<string>(() => {
    return localStorage.getItem('compilar_active_web_file_v2') || 'index.html';
  });
  const [openWebFiles, setOpenWebFiles] = useState<string[]>(() => {
    const saved = localStorage.getItem('compilar_open_web_files_v2');
    return saved ? JSON.parse(saved) : ['index.html', 'style.css', 'script.js'];
  });
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);

  const rawOutputRef = useRef<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  // Save web files to local storage on change
  useEffect(() => {
    localStorage.setItem('compilar_web_files', JSON.stringify(webFiles));
  }, [webFiles]);

  const writeToTerminal = (text: string) => {
    setTerminalOutput({ text, id: Date.now() + Math.random() });
  };

  const generatePreviewUrl = useCallback(() => {
    let htmlFileNode = webFiles.find(f => f.id === activeWebFileId && f.name.endsWith('.html'));
    if (!htmlFileNode) htmlFileNode = webFiles.find(f => f.name.endsWith('.html'));
    
    let htmlFile = htmlFileNode?.content || '<h1>No HTML file found!</h1>';
    const parentFolderId = htmlFileNode?.parentId || null;

    const cssFiles = webFiles.filter(f => f.name.endsWith('.css') && f.parentId === parentFolderId);
    const jsFiles = webFiles.filter(f => f.name.endsWith('.js') && f.parentId === parentFolderId);
    
    for (const css of cssFiles) {
      const linkTagRegex = new RegExp(`<link[^>]*href=["']${css.name}["'][^>]*>`, 'gi');
      if (htmlFile.match(linkTagRegex)) {
        htmlFile = htmlFile.replace(linkTagRegex, `<style>${css.content}</style>`);
      }
    }
    for (const js of jsFiles) {
      const scriptTagRegex = new RegExp(`<script[^>]*src=["']${js.name}["'][^>]*><\\/script>`, 'gi');
      if (htmlFile.match(scriptTagRegex)) {
        htmlFile = htmlFile.replace(scriptTagRegex, `<script>${js.content}</script>`);
      }
    }
    
    const blob = new Blob([htmlFile], { type: 'text/html' });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return url;
  }, [webFiles]);

  const handleRun = () => {
    if (language.id === 'web') {
      generatePreviewUrl();
      if (window.innerWidth <= 1024) setActiveTab('terminal');
      return;
    }

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

    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws/run';

    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const connectionTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        writeToTerminal('\r\n\x1b[31mError: Cannot connect to backend.\x1b[0m\r\n');
        writeToTerminal('\x1b[90mMake sure the backend is running: cd backend && npm start\x1b[0m\r\n');
        setIsPending(false);
        isPendingRef.current = false;
      }
    }, 5000);

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

  const handleLanguageChange = (langId: string) => {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (lang) {
      setLanguage(lang);
      if (lang.id !== 'web') {
        setCode(DEFAULT_CODE[lang.id]);
      }
    }
  };

  const handleCodeChange = (val: string | undefined) => {
    if (language.id === 'web') {
      setWebFiles(prev => prev.map(f => f.id === activeWebFileId ? { ...f, content: val || '' } : f));
    } else {
      setCode(val || '');
    }
  };

  const handleDownload = () => {
    if (language.id === 'web') return; // For simplicity, exclude web project download
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

  const handleOpenInChrome = () => {
    let url = previewUrl;
    if (!url) {
      url = generatePreviewUrl();
    }
    window.open(url, '_blank');
  };

  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  useEffect(() => {
    localStorage.setItem('compilar_web_files_v3', JSON.stringify(webFiles));
  }, [webFiles]);

  useEffect(() => {
    localStorage.setItem('compilar_active_web_file_v3', activeWebFileId);
  }, [activeWebFileId]);

  const isWeb = language.id === 'web';
  useEffect(() => {
    localStorage.setItem('compilar_open_web_files_v3', JSON.stringify(openWebFiles));
  }, [openWebFiles]);

  const handleTabClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newOpenFiles = openWebFiles.filter(f => f !== id);
    setOpenWebFiles(newOpenFiles);
    if (activeWebFileId === id) {
      setActiveWebFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : '');
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.html')) return <FileCode size={14} color="#e34c26" />;
    if (name.endsWith('.css')) return <FileCode size={14} color="#264de4" />;
    if (name.endsWith('.js')) return <FileCode size={14} color="#f0db4f" />;
    return <File size={14} color="#9ca3af" />;
  };

  const activeFileNode = isWeb ? webFiles.find(f => f.id === activeWebFileId) : null;
  const currentCode = isWeb ? (activeFileNode?.content || '') : code;
  const currentFileName = isWeb ? (activeFileNode?.name || '') : `main.${EXT[language.id]}`;
  const editorLanguage = isWeb ? (activeFileNode?.name.split('.').pop() || 'html') : language.id;

  return (
    <div className="app-root">
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
          {isWeb && (
            <button 
              onClick={() => setDesktopSidebarOpen(prev => !prev)}
              style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px' }}
              title="Toggle File Explorer"
            >
              <Sidebar size={16} />
            </button>
          )}
          <div className="lang-selector-group">
            <span className="lang-label">Language:</span>
            <CustomSelect options={LANGUAGES} value={language.id} onChange={handleLanguageChange} />
          </div>

          <button onClick={handleRun} className={`btn-run${isPending && !isWeb ? ' running' : ''}`}>
            {isPending && !isWeb
              ? <><Square size={13} style={{ marginRight: 5 }} />STOP</>
              : <><Play size={13} style={{ marginRight: 5 }} />RUN</>}
          </button>
        </div>

        <div className="nav-group nav-right">
          {!isWeb && (
            <button onClick={handleDownload} className="btn-download" title="Download code">
              <Download size={16} />
              <span className="desktop-only">Download</span>
            </button>
          )}
          {isWeb && (
            <button onClick={handleOpenInChrome} className="btn-download" title="Open in Chrome">
              <Globe size={16} />
              <span className="desktop-only">Open in Chrome</span>
            </button>
          )}
        </div>
      </nav>

      <div className="mobile-tabs">
        <button className={activeTab === 'editor' ? 'active' : ''} onClick={() => setActiveTab('editor')}>
          <Monitor size={14} style={{ marginRight: 4 }} /> Editor
        </button>
        <button className={activeTab === 'terminal' ? 'active' : ''} onClick={() => setActiveTab('terminal')}>
          <span className="tab-icon">{isWeb ? <Globe size={14}/> : '$'}</span>
          {isWeb ? 'Preview' : 'Terminal'}
          {isPending && !isWeb && <span className="tab-running-dot" />}
        </button>
      </div>

      <main className="app-main">
        {isWeb && (
          <FileExplorer
            className={!desktopSidebarOpen ? 'mobile-hidden desktop-hidden' : ''}
            files={webFiles}
            setFiles={setWebFiles}
            activeFileId={activeWebFileId}
            setActiveFileId={(id) => {
              setActiveWebFileId(id);
              setOpenWebFiles(prev => prev.includes(id) ? prev : [...prev, id]);
              if (window.innerWidth <= 1024) {
                setActiveTab('editor');
                setDesktopSidebarOpen(false);
              }
            }}
          />
        )}

        <section className={`editor-section${activeTab !== 'editor' ? ' mobile-hidden' : ''}`}>
          {isWeb ? (
            <header className="editor-tabs-container">
              {openWebFiles.map(id => {
                const f = webFiles.find(x => x.id === id);
                if (!f) return null;
                return (
                  <div 
                    key={id} 
                    className={`editor-tab ${activeWebFileId === id ? 'active' : ''}`}
                    onClick={() => setActiveWebFileId(id)}
                  >
                    <span style={{ marginRight: 6, display: 'flex' }}>{getFileIcon(f.name)}</span>
                    <span className="tab-name">{f.name}</span>
                    <button className="editor-tab-close" onClick={(e) => handleTabClose(e, id)}>
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </header>
          ) : (
            <header className="section-header">
              <div className="header-label">
                <Monitor size={13} />
                <span>{currentFileName}</span>
              </div>
              <div className="header-label">
                <span>{language.version}</span>
              </div>
            </header>
          )}
          <div className="editor-body">
            <Editor
              language={editorLanguage}
              code={currentCode}
              onChange={handleCodeChange}
            />
          </div>
        </section>

        <aside className={`sidebar-section${activeTab !== 'terminal' ? ' mobile-hidden' : ''}`}>
          {!isWeb && (
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
          )}

          <div className="output-area">
            <div className="output-header">
              <div className="output-header-left">
                <span className="output-header-dot" />
                <span>{isWeb ? 'Live Preview' : 'Terminal'}</span>
                {isWeb && previewUrl && (
                  <button 
                    onClick={() => window.open(previewUrl, '_blank')}
                    style={{ background: 'none', border: 'none', color: '#61dafb', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                    title="Open in Chrome"
                  >
                    <Globe size={14} />
                  </button>
                )}
                {isPending && !isWeb && <span className="running-badge">RUNNING</span>}
              </div>
              {!isWeb && (
                <button className={`btn-copy-output${copyDone ? ' copied' : ''}`} onClick={handleCopyOutput} title="Copy terminal output">
                  {copyDone ? <><CheckCheck size={14} /><span>Copied!</span></> : <><Copy size={14} /><span>Copy</span></>}
                </button>
              )}
            </div>
            <div className="terminal-wrapper" style={{ background: isWeb ? '#fff' : '#1e1e1e' }}>
              {isWeb ? (
                previewUrl ? (
                  <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} title="Preview" sandbox="allow-scripts allow-same-origin" />
                ) : (
                  <div style={{ padding: 20, color: '#333', textAlign: 'center', fontFamily: 'sans-serif' }}>Click RUN to preview your website.</div>
                )
              ) : (
                <MyTerminal onInput={handleTerminalInput} output={terminalOutput} isPending={isPending} />
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
