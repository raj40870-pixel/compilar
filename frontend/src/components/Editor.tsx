import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { LANGUAGE_COMPLETIONS } from '../utils/completionData';

interface EditorProps {
  language: string;
  code: string;
  onChange: (value: string | undefined) => void;
  theme?: string;
}

const Editor = ({ language, code, onChange, theme = 'vs-dark' }: EditorProps) => {
  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'java': return 'java';
      case 'javascript': return 'javascript';
      case 'python': return 'python';
      default: return 'javascript';
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Register completions for each language defined in completionData
    // We use a flag on the monaco instance to ensure we only register once
    if (!(monaco as any).__completionsRegistered) {
      Object.entries(LANGUAGE_COMPLETIONS).forEach(([lang, items]) => {
        monaco.languages.registerCompletionItemProvider(lang, {
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            return {
              suggestions: items.map((item) => ({
                label: item.label,
                kind: item.kind,
                insertText: item.insertText,
                detail: item.detail,
                documentation: item.documentation,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: range,
              })),
            };
          },
        });
      });
      (monaco as any).__completionsRegistered = true;
    }

    // Focus the editor
    editor.focus();
  };

  return (
    <div className="editor-container" style={{ height: '100%', width: '100%' }}>
      <MonacoEditor
        height="100%"
        language={getMonacoLanguage(language)}
        value={code}
        theme={theme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          padding: { top: 16, bottom: 16 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          quickSuggestionsDelay: 10,
          wordBasedSuggestions: "allDocuments",
          parameterHints: {
            enabled: true,
          },
          suggest: {
            showIcons: true,
            snippetsPreventQuickSuggestions: false,
            filterGraceful: true,
            shareSuggestionsWithOtherEditors: true,
          }
        }}
      />
    </div>
  );
};

export default Editor;
