import React from 'react';
import { Smartphone, ExternalLink, Code2 } from 'lucide-react';

interface StatusBarProps {
  languageName: string;
  languageVersion: string;
  onOpenAppInfo: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  languageName,
  languageVersion,
  onOpenAppInfo,
}) => {
  return (
    <footer className="ide-statusbar">
      <div className="statusbar-left">
        <span className="statusbar-item statusbar-lang">
          <Code2 size={12} />
          <span>{languageName}</span>
          <span className="statusbar-dim">({languageVersion})</span>
        </span>
        <span className="statusbar-separator">|</span>
        <span className="statusbar-item desktop-only">UTF-8</span>
        <span className="statusbar-separator desktop-only">|</span>
        <span className="statusbar-item desktop-only">Spaces: 4</span>
      </div>

      <div className="statusbar-right">
        <button
          type="button"
          onClick={onOpenAppInfo}
          className="statusbar-app-trigger"
          title="Official Android App by Compiler Team"
        >
          <span className="statusbar-live-dot"></span>
          <Smartphone size={12} />
          <span className="statusbar-app-label">
            Official Android App: <strong>Code Editor</strong>
          </span>
          <span className="statusbar-app-badge">🇮🇳 Indus Appstore</span>
          <ExternalLink size={11} className="statusbar-ext-icon" />
        </button>
      </div>
    </footer>
  );
};

export default StatusBar;
