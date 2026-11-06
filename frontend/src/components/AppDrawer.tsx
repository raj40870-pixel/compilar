import React from 'react';
import { X, ExternalLink, Smartphone, Zap, ShieldCheck, Terminal, Cpu } from 'lucide-react';

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const INDUS_URL = 'https://www.phonepeappstore.com/apps/education/code-editor/app.code.editor/?page=details&id=app.code.editor';
const PORTAL_URL = 'https://code-eidter-apk-website.vercel.app/';

export const AppDrawer: React.FC<AppDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <div className="drawer-icon-wrap">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="drawer-tag">Official Android Release • Indus Appstore</div>
              <h3 className="drawer-title">Code Editor (TermCode IDE)</h3>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close panel">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-intro">
            While you code on our online compiler website, we've officially launched our native Android app — <strong>Code Editor (TermCode IDE)</strong> on PhonePe's Indus Appstore! Compile and run 15+ languages 100% offline directly on your phone.
          </div>

          <div className="drawer-features">
            <div className="drawer-feat-item">
              <Zap size={16} className="feat-ico feat-zap" />
              <div>
                <strong>100% Offline Compilation</strong>
                <p>Run C, C++, Python, Java OpenJDK, Rust, Go & 15+ stacks locally without internet.</p>
              </div>
            </div>

            <div className="drawer-feat-item">
              <Terminal size={16} className="feat-ico feat-term" />
              <div>
                <strong>Sandboxed Linux Terminal</strong>
                <p>Full real-time command line output streaming and execution.</p>
              </div>
            </div>

            <div className="drawer-feat-item">
              <Cpu size={16} className="feat-ico feat-cpu" />
              <div>
                <strong>Ultra-Lightweight (under 4 MB)</strong>
                <p>Low memory footprint, battery friendly, smooth on any Android 7.0+ device.</p>
              </div>
            </div>

            <div className="drawer-feat-item">
              <ShieldCheck size={16} className="feat-ico feat-shield" />
              <div>
                <strong>Verified Indus Store Build</strong>
                <p>No root required, safe sandboxed package manager, Target SDK 36 compliant.</p>
              </div>
            </div>
          </div>

          {/* ── OFFICIAL LAUNCH CARD WITH USER'S CHOSEN TEXT ── */}
          <div className="drawer-cta-card">
            <div className="cta-heading">
              Using our Compiler? We've officially launched &quot;Code Editor&quot; on Indus Appstore — Check it out ↗
            </div>
            <p className="cta-sub">
              Built by our team for developers and students. Experience offline mobile compilation directly from India&apos;s Indus Appstore.
            </p>
            <div className="drawer-actions">
              <a
                href={INDUS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-drawer-indus"
              >
                <Smartphone size={16} />
                <span>Visit &amp; Install on Indus Appstore 🇮🇳</span>
                <ExternalLink size={14} />
              </a>

              <a
                href={PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-drawer-portal"
              >
                <ExternalLink size={14} />
                <span>Setup Guide &amp; Portal</span>
              </a>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <span>Version 1.4.8 • Indus Appstore Verified • Android 7.0+</span>
        </div>
      </aside>
    </div>
  );
};

export default AppDrawer;
