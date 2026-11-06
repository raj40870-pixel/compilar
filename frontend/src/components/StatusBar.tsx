import React from 'react';
import { ExternalLink, Code2 } from 'lucide-react';

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
      <div className="statusbar-left desktop-only">
        <span className="statusbar-item statusbar-lang">
          <Code2 size={12} />
          <span>{languageName}</span>
          <span className="statusbar-dim">({languageVersion})</span>
        </span>
        <span className="statusbar-separator">|</span>
        <span className="statusbar-item">UTF-8</span>
        <span className="statusbar-separator">|</span>
        <span className="statusbar-item">Spaces: 4</span>
      </div>

      <div className="statusbar-right">
        <button
          type="button"
          onClick={onOpenAppInfo}
          className="statusbar-app-trigger"
          title="We've officially launched Code Editor on Indus Appstore — Check it out"
        >
          <span className="statusbar-live-dot"></span>
          <span className="statusbar-app-label desktop-only">
            Using our Compiler? We&apos;ve officially launched <strong>&quot;Code Editor&quot;</strong> on Indus Appstore — Check it out
          </span>
          <span className="statusbar-app-label mobile-only">
            🚀 Official <strong>&quot;Code Editor&quot;</strong> App on Indus Appstore — Tap to View
          </span>
          <ExternalLink size={11} className="statusbar-ext-icon" />
        </button>
      </div>
    </footer>
  );
};

export default StatusBar;
