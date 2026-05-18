import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface MyTerminalProps {
  onInput: (data: string) => void;
  output: { text: string; id: number };
  isPending: boolean;
}

export default function MyTerminal({ onInput, output, isPending }: MyTerminalProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal | null>(null);

  // Use refs for inputs and state to prevent useEffect recreation and keep terminal instance alive
  const onInputRef = useRef(onInput);
  const isPendingRef = useRef(isPending);
  const lineBuffer = useRef<string>('');
  const cursorPosition = useRef<number>(0);
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const tempInput = useRef<string>('');

  useEffect(() => {
    onInputRef.current = onInput;
  }, [onInput]);

  useEffect(() => {
    isPendingRef.current = isPending;
    if (isPending) {
      // Reset input state when a new process starts
      lineBuffer.current = '';
      cursorPosition.current = 0;
      historyIndex.current = -1;
      tempInput.current = '';
    }
  }, [isPending]);

  useEffect(() => {
    if (!termRef.current) return;

    term.current = new Terminal({
      cursorBlink: true,
      convertEol: true,
      theme: { 
        background: '#1e1e1e', 
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        selectionBackground: '#3a3d41'
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2
    });
    
    const fitAddon = new FitAddon();
    term.current.loadAddon(fitAddon);
    term.current.open(termRef.current);
    
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (err) {
        console.warn('Initial terminal fit failed:', err);
      }
    }, 100);

    const disposable = term.current.onData(data => {
      // Only process keystrokes if the process is running
      if (!isPendingRef.current) return;

      const t = term.current;
      if (!t) return;

      // 1. Handle Enter (Submit Line)
      if (data === '\r' || data === '\n') {
        const line = lineBuffer.current;
        
        // Add to command history if it's not empty and not identical to the last command
        if (line.trim() && (history.current.length === 0 || history.current[history.current.length - 1] !== line)) {
          history.current.push(line);
        }
        historyIndex.current = -1;
        tempInput.current = '';
        
        lineBuffer.current = '';
        cursorPosition.current = 0;

        t.write('\r\n');
        onInputRef.current(line + '\n');
        return;
      }

      // 2. Handle Backspace (\x7f or \x08)
      if (data === '\x7f' || data === '\x08') {
        if (cursorPosition.current > 0) {
          const left = lineBuffer.current.slice(0, cursorPosition.current - 1);
          const right = lineBuffer.current.slice(cursorPosition.current);
          lineBuffer.current = left + right;
          cursorPosition.current--;

          // Move cursor back, clear to end of line, write the remaining characters, and restore cursor position
          t.write('\b\x1b[K');
          if (right) {
            t.write(right);
            for (let i = 0; i < right.length; i++) {
              t.write('\x1b[D'); // Move cursor back left
            }
          }
        }
        return;
      }

      // 3. Handle Arrow Keys & Escape Sequences
      if (data.startsWith('\x1b')) {
        // Left Arrow
        if (data === '\x1b[D') {
          if (cursorPosition.current > 0) {
            cursorPosition.current--;
            t.write('\x1b[D');
          }
          return;
        }
        // Right Arrow
        if (data === '\x1b[C') {
          if (cursorPosition.current < lineBuffer.current.length) {
            cursorPosition.current++;
            t.write('\x1b[C');
          }
          return;
        }
        // Up Arrow (Browse History backward)
        if (data === '\x1b[A') {
          if (history.current.length === 0) return;
          
          if (historyIndex.current === -1) {
            tempInput.current = lineBuffer.current;
            historyIndex.current = history.current.length - 1;
          } else if (historyIndex.current > 0) {
            historyIndex.current--;
          } else {
            return; // At the oldest entry
          }

          // Move cursor back to start of input and clear line from cursor onwards
          for (let i = 0; i < cursorPosition.current; i++) {
            t.write('\b');
          }
          t.write('\x1b[K');

          const histCmd = history.current[historyIndex.current];
          lineBuffer.current = histCmd;
          cursorPosition.current = histCmd.length;
          t.write(histCmd);
          return;
        }
        // Down Arrow (Browse History forward)
        if (data === '\x1b[B') {
          if (historyIndex.current === -1) return;

          // Move cursor back to start of input and clear line
          for (let i = 0; i < cursorPosition.current; i++) {
            t.write('\b');
          }
          t.write('\x1b[K');

          if (historyIndex.current === history.current.length - 1) {
            historyIndex.current = -1;
            lineBuffer.current = tempInput.current;
            cursorPosition.current = tempInput.current.length;
            t.write(tempInput.current);
          } else {
            historyIndex.current++;
            const histCmd = history.current[historyIndex.current];
            lineBuffer.current = histCmd;
            cursorPosition.current = histCmd.length;
            t.write(histCmd);
          }
          return;
        }
        
        // Ignore any other escape codes
        return;
      }

      // 4. Handle Normal Printable Characters
      if (data.charCodeAt(0) >= 32) {
        const left = lineBuffer.current.slice(0, cursorPosition.current);
        const right = lineBuffer.current.slice(cursorPosition.current);
        lineBuffer.current = left + data + right;
        cursorPosition.current += data.length;

        t.write(data);
        if (right) {
          t.write(right);
          for (let i = 0; i < right.length; i++) {
            t.write('\x1b[D'); // Restore cursor back to correct position
          }
        }
      }
    });

    const cleanSystemMessages = (text: string): string => {
      return text
        .split(/\r?\n/)
        .filter(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('[System]')) return false;
          if (/^(Compiling|Starting|Initializing|Process\s+exited)/i.test(trimmed)) return false;
          if (trimmed.includes('[System]')) return false;
          return true;
        })
        .join('\n');
    };

    const handleCopy = (e: ClipboardEvent) => {
      let selectedText = '';
      if (term.current && term.current.hasSelection()) {
        selectedText = term.current.getSelection();
      } else {
        const selection = window.getSelection();
        selectedText = selection ? selection.toString() : '';
      }
      
      if (selectedText) {
        const cleaned = cleanSystemMessages(selectedText);
        e.clipboardData?.setData('text/plain', cleaned);
        e.preventDefault();
      }
    };

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (err) {
        console.warn('Terminal resize fit failed:', err);
      }
    };
    
    window.addEventListener('resize', handleResize);
    if (termRef.current) {
      termRef.current.addEventListener('copy', handleCopy as any);
    }

    return () => {
      disposable.dispose();
      window.removeEventListener('resize', handleResize);
      if (termRef.current) {
        termRef.current.removeEventListener('copy', handleCopy as any);
      }
      if (term.current) {
        term.current.dispose();
      }
    };
  }, []);

  // Update terminal when output is received from the server
  useEffect(() => {
    if (term.current && output.text) {
      term.current.write(output.text);
    }
  }, [output]);

  return (
    <div 
      ref={termRef} 
      style={{ 
        height: '100%', 
        width: '100%', 
        background: '#1e1e1e', 
        padding: '8px', 
        boxSizing: 'border-box' 
      }} 
    />
  );
}
