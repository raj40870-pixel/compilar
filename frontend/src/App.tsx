import { useState } from 'react';
import Editor from './components/Editor';
import OutputArea from './components/OutputArea';
import CustomSelect from './components/CustomSelect';
import { Download, Monitor } from 'lucide-react';
import axios from 'axios';

const LANGUAGES = [
  { id: 'c', name: 'C', version: 'GCC 13' },
  { id: 'cpp', name: 'C++', version: 'G++ 13' },
  { id: 'python', name: 'Python', version: '3.12' },
  { id: 'java', name: 'Java', version: 'JDK 21' },
  { id: 'javascript', name: 'JavaScript', version: 'Node 20' },
];

const DEFAULT_CODE: Record<string, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}',
  python: 'print("Hello World")',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
  javascript: 'console.log("Hello World");',
};

function App() {
  const [language, setLanguage] = useState(LANGUAGES[4]);
  const [code, setCode] = useState(DEFAULT_CODE[LANGUAGES[4].id]);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [stdin, setStdin] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'input' | 'output'>('editor');

  const handleRun = async () => {
    setIsPending(true);
    setOutput('');
    setError('');

    // Auto switch to output tab on mobile
    if (window.innerWidth <= 1024) {
      setActiveTab('output');
    }

    try {
      const backendUrl = import.meta.env.MODE === 'development'
        ? 'http://localhost:8080'
        : import.meta.env.VITE_BACKEND_URL || 'https://compilar-backend.onrender.com';
      const response = await axios.post(`${backendUrl}/api/run`, {
        language: language.id,
        code,
        input: stdin
      });
      setOutput(response.data.output);
      setError(response.data.error);
      setIsPending(false);
    } catch (err: any) {
      console.error('Run request failed:', err);
      setError(err.response?.data?.error || 'Failed to connect to server. Make sure the backend is running.');
      setIsPending(false);
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
    const extensions: Record<string, string> = {
      c: 'c',
      cpp: 'cpp',
      python: 'py',
      java: 'java',
      javascript: 'js',
    };
    const ext = extensions[language.id] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // cleanup
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar">
        <div className="nav-group">
          <div className="lang-selector-group">
            <span>Language:</span>
            <CustomSelect
              options={LANGUAGES}
              value={language.id}
              onChange={handleLanguageChange}
            />
          </div>
        </div>

        <div className="nav-group">
          <button onClick={handleRun} disabled={isPending} className="btn-run">
            {isPending ? 'RUNNING...' : 'RUN'}
          </button>
        </div>

        <div className="nav-group">
          <button onClick={handleDownload} className="btn-download" title="Download code">
            <Download size={18} />
            <span className="desktop-only">Download</span>
          </button>
        </div>
      </nav>

      {/* Mobile Tabs — NO inline display:none so CSS media query controls visibility */}
      <div className="mobile-tabs">
        <button
          className={activeTab === 'editor' ? 'active' : ''}
          onClick={() => setActiveTab('editor')}
        >
          Editor
        </button>
        <button
          className={activeTab === 'input' ? 'active' : ''}
          onClick={() => setActiveTab('input')}
        >
          Input
        </button>
        <button
          className={activeTab === 'output' ? 'active' : ''}
          onClick={() => setActiveTab('output')}
        >
          Output {error && <span style={{ color: '#ef4444' }}>●</span>}
        </button>
      </div>

      <main className="app-main">
        <section className={`editor-section ${activeTab !== 'editor' ? 'mobile-hidden' : ''}`}>
          <header className="section-header">
            <div className="header-label">
              <Monitor size={14} />
              <span>main.{language.id === 'python' ? 'py' : language.id === 'javascript' ? 'js' : language.id}</span>
            </div>
            <div className="header-label">
              <span>{language.version}</span>
            </div>
          </header>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              language={language.id}
              code={code}
              onChange={(val) => setCode(val || '')}
            />
          </div>
        </section>

        <aside className={`sidebar-section ${activeTab === 'editor' ? 'mobile-hidden' : ''}`}>
          <div className={`sidebar-group ${activeTab === 'output' ? 'mobile-hidden' : ''}`}>
            <label className="sidebar-label">Standard Input (stdin)</label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input here..."
              className="stdin-textarea"
            />
          </div>

          <div style={{ flex: 1, minHeight: 0 }} className={activeTab === 'input' ? 'mobile-hidden' : ''}>
            <OutputArea output={output} error={error} isPending={isPending} />
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
