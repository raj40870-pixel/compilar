import { useState } from 'react';
import Editor from './components/Editor';
import OutputArea from './components/OutputArea';
import { Monitor, Download } from 'lucide-react';
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
  const [showMenu, setShowMenu] = useState(false);

  const handleRun = async () => {
    setIsPending(true);
    setOutput('');
    setError('');
    setExecutionTime(undefined);

    if (window.innerWidth <= 768) {
      setActiveTab('output');
    }

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
      {/* Navbar */}
      <nav className="navbar glass" style={{ 
        height: '70px', 
        padding: '0 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div className="nav-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', margin: 0 }}>
            {language.id === 'cpp' ? 'Coding C++' : language.id === 'c' ? 'Coding C' : language.name}
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isPending ? 'Executing...' : output || error ? 'Execution finished' : 'Nothing changed'}
          </span>
        </div>

        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleRun}
            disabled={isPending}
            style={{ 
              color: isPending ? 'var(--text-muted)' : '#fff', 
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '1px',
              padding: '8px 12px',
              borderRadius: '4px',
              background: isPending ? 'rgba(255,255,255,0.05)' : 'transparent'
            }}
          >
            RUN
          </button>
          
          <button 
            onClick={() => setShowMenu(true)}
            style={{ 
              color: '#fff', 
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '1px',
              padding: '8px 12px'
            }}
          >
            MENU
          </button>
        </div>
      </nav>

      {/* Side Menu Drawer */}
      {showMenu && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 20000,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end'
        }} onClick={() => setShowMenu(false)}>
          <div style={{
            width: '280px',
            height: '100%',
            background: 'var(--bg-secondary)',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Menu</h2>
              <button onClick={() => setShowMenu(false)} style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select Language</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      handleLanguageChange(lang.id);
                      setShowMenu(false);
                    }}
                    style={{
                      padding: '12px',
                      background: language.id === lang.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button 
                onClick={handleDownload}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-tertiary)',
                  color: '#fff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600
                }}
              >
                <Download size={18} /> Download Code
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={14} className="text-secondary" />
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>main.{language.id === 'python' ? 'py' : language.id === 'javascript' ? 'js' : language.id}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{language.version}</span>
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
