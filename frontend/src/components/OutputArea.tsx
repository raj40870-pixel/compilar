import { Terminal as TerminalIcon, XCircle, Clock } from 'lucide-react';

interface OutputAreaProps {
  output: string;
  error: string;
  executionTime?: string;
  isPending: boolean;
}

const OutputArea = ({ output, error, executionTime, isPending }: OutputAreaProps) => {
  return (
    <div className="output-area glass" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRadius: 'var(--radius-md)'
    }}>
      <div className="output-header" style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TerminalIcon size={16} className="text-secondary" />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Terminal Output</span>
        </div>
        {executionTime && !isPending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Clock size={12} />
            <span>{executionTime}ms</span>
          </div>
        )}
      </div>
      
      <div className="output-content mono" style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        fontSize: '0.875rem',
        whiteSpace: 'pre-wrap',
        color: error ? 'var(--error)' : 'var(--text-primary)',
        background: '#0d0d0f'
      }}>
        {isPending ? (
          <div style={{ color: 'var(--text-muted)' }}>Executing code...</div>
        ) : (output || error) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {output && (
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output</div>
                <div style={{ color: 'var(--text-primary)' }}>{output}</div>
              </div>
            )}
            {error && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <XCircle size={12} />
                  <span style={{ fontWeight: 600 }}>Execution Error</span>
                </div>
                <div style={{ color: 'var(--error)' }}>{error}</div>
                {error.includes('import java.') && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '4px', color: '#60a5fa', fontSize: '0.8rem' }}>
                    💡 <b>Tip:</b> It looks like you're trying to run <b>Java</b> code in <b>JavaScript</b> mode. Please change the language at the top.
                  </div>
                )}
                {error.includes('using namespace std') && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '4px', color: '#60a5fa', fontSize: '0.8rem' }}>
                    💡 <b>Tip:</b> It looks like you're using <b>C++</b> syntax in <b>C</b> mode. Please change the language to <b>C++</b>.
                  </div>
                )}
                {error.includes('SyntaxError: Cannot use import statement outside a module') && !error.includes('java') && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '4px', color: '#60a5fa', fontSize: '0.8rem' }}>
                    💡 <b>Tip:</b> Node.js uses CommonJS. Try using <code>require()</code> instead of <code>import</code>.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>Run your code to see the output here.</div>
        )}
      </div>
    </div>
  );
};

export default OutputArea;
