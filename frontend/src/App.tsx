// DO NOT CHANGE UI LAYOUT - CLIENT APPROVED VERSION
// If you modify top bar or add MENU button, REVERT IMMEDIATELY
import { useState } from 'react';
import Editor from './components/Editor';
import OutputArea from './components/OutputArea';
import { Download } from 'lucide-react';
import axios from 'axios';

const LANGUAGES = [
  { id: 'c', name: 'C', icon: 'C', version: 'GCC 13' },
  { id: 'cpp', name: 'C++', icon: 'C++', version: 'G++ 13' },
  { id: 'python', name: 'Python', icon: 'Py', version: '3.12' },
  { id: 'java', name: 'Java', icon: 'Ja', version: 'JDK 21' },
  { id: 'javascript', name: 'JavaScript', icon: 'JS', version: 'Node 20' },
];

const DEFAULT_CODE: Record<string, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}',
  python: 'print("Hello World")',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
  javascript: 'console.log("Hello World");',
};

function App() {
  const [language, setLanguage] = useState(LANGUAGES[4]); // JS default
  const [code, setCode] = useState(DEFAULT_CODE[LANGUAGES[4].id]);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [executionTime, setExecutionTime] = useState<string | undefined>();
  const [stdin, setStdin] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'input' | 'output'>('editor');

  const handleRun = async () => {
    setIsPending(true);
    setOutput('');
    setError('');
    setExecutionTime(undefined);

    if (window.innerWidth <= 1024) {
      setActiveTab('output');
    }

    setActiveTab('output');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://compilar-backend.onrender.com';
      const response = await axios.post(`${backendUrl}/api/run`, {
        language: language.id,
        code,
        input: stdin
      });
      setOutput(response.data.output);
      setError(response.data.error);
      setExecutionTime(response.data.time);
      setIsPending(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to connect to the execution server.');
      setIsPending(false);
    }
  };

  const handleLanguageChange = (langId: string) => {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (lang) {
      if (code !== DEFAULT_CODE[language.id] && code !== '') {
        if (!window.confirm('Change language? Current code will be replaced.')) {
          return;
        }
      }
      setLanguage(lang);
      setCode(DEFAULT_CODE[lang.id]);
    }
  };

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      c: 'c',
      cpp: 'cpp',
      python: 'py',
      javascript: 'js'
    };
    const extension = extensions[language.id] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <nav className="navbar" style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', color: '#fff' }}>
            Coding {language.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select 
              value={language.id} 
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="lang-select"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
            <div style={{ 
              background: 'rgba(56, 139, 253, 0.15)', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              color: '#388bfd',
              border: '1px solid rgba(56, 139, 253, 0.4)'
            }}>
              {language.version}
            </div>
          </div>
        </div>

        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleRun}
            disabled={isPending}
            className="btn-run"
            style={{ 
              minWidth: '100px',
              height: '38px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {isPending ? 'Running...' : 'RUN'}
          </button>
          <button 
            onClick={handleDownload}
            className="btn-download"
            style={{ 
              height: '38px',
              padding: '0 16px',
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Download size={18} />
            <span className="desktop-only">DOWNLOAD</span>
          </button>
        </div>
      </nav>

      {/* Mobile Tabs */}
      <div className="mobile-tabs glass" style={{ 
        display: 'none',
        flexShrink: 0
      }}>
        <button 
          onClick={() => setActiveTab('editor')}
          style={{ 
            color: activeTab === 'editor' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'editor' ? 600 : 400,
            borderBottom: activeTab === 'editor' ? '2px solid var(--accent-primary)' : 'none',
            height: '100%',
            padding: '0 12px'
          }}
        >
          Editor
        </button>
        <button 
          onClick={() => setActiveTab('input')}
          style={{ 
            color: activeTab === 'input' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'input' ? 600 : 400,
            borderBottom: activeTab === 'input' ? '2px solid var(--accent-primary)' : 'none',
            height: '100%',
            padding: '0 12px'
          }}
        >
          Input
        </button>
        <button 
          onClick={() => setActiveTab('output')}
          style={{ 
            color: activeTab === 'output' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'output' ? 600 : 400,
            borderBottom: activeTab === 'output' ? '2px solid var(--accent-primary)' : 'none',
            height: '100%',
            padding: '0 12px'
          }}
        >
          Output {error && <span style={{ color: 'var(--error)' }}>●</span>}
        </button>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {/* Editor Area */}
        <div className={`editor-area ${activeTab !== 'editor' ? 'mobile-hidden' : ''}`}>
          <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>main.{language.id === 'python' ? 'py' : language.id === 'javascript' ? 'js' : language.id}</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
              {language.version}
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <Editor 
              language={language.id} 
              code={code} 
              onChange={(val) => setCode(val || '')} 
            />
          </div>
        </div>

        {/* Sidebar / Output Area */}
        <div className={`sidebar ${activeTab === 'editor' ? 'mobile-hidden' : ''}`}>
          <div className={activeTab === 'input' || activeTab === 'editor' ? '' : 'mobile-hidden'} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Standard Input (stdin)</label>
            <textarea 
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input here..."
              className="mono"
              style={{ 
                width: '100%', 
                height: '100px', 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '12px',
                resize: 'none',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>
          
          <div className={activeTab === 'output' || activeTab === 'editor' ? '' : 'mobile-hidden'} style={{ flex: 1 }}>
            <OutputArea 
              output={output} 
              error={error} 
              isPending={isPending} 
              executionTime={executionTime} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
