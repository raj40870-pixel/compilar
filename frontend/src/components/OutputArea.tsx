import { Terminal as TerminalIcon } from 'lucide-react';

interface OutputAreaProps {
  output: string;
  error: string;
  isPending: boolean;
}

const OutputArea = ({ output, error, isPending }: OutputAreaProps) => {
  return (
    <div className="output-area">
      <div className="output-header">
        <TerminalIcon size={16} />
        <span>Terminal Output</span>
      </div>
      
      <div className="output-panel mono">
        {isPending ? (
          <div className="output-empty">Executing code...</div>
        ) : (output || error) ? (
          <div>
            {output && <div>{output}</div>}
            {error && <div className="output-error" style={{ marginTop: output ? '8px' : '0' }}>{error}</div>}
          </div>
        ) : (
          <div className="output-empty">Run your code to see the output here.</div>
        )}
      </div>
    </div>
  );
};

export default OutputArea;
