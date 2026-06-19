'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ProctoringWrapper({ children, onAutoSubmit, isAssessmentActive }) {
  const [warnings, setWarnings] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const MAX_WARNINGS = 3;

  const triggerWarning = useCallback((message) => {
    if (!isAssessmentActive) return;

    setWarnings((prev) => {
      const newWarnings = prev + 1;
      if (newWarnings >= MAX_WARNINGS) {
        setWarningMessage('Maximum warnings exceeded. Auto-submitting assessment.');
        setShowWarningModal(true);
        setTimeout(() => {
          onAutoSubmit('violation');
        }, 3000);
      } else {
        setWarningMessage(`${message} \nWarning ${newWarnings} of ${MAX_WARNINGS}. At ${MAX_WARNINGS} warnings, your exam will be automatically submitted.`);
        setShowWarningModal(true);
      }
      return newWarnings;
    });
  }, [isAssessmentActive, onAutoSubmit]);

  const enforceFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.log('Fullscreen failed:', err));
    }
    setIsFullscreen(true);
  };

  useEffect(() => {
    if (!isAssessmentActive) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerWarning('Tab switch or browser minimization detected.');
      }
    };

    const handleBlur = () => {
      triggerWarning('Window change detected. Please stay on the assessment window.');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        triggerWarning('You exited fullscreen mode. This is a violation.');
      }
    };

    const blockKeys = (e) => {
      // Block F12
      if (e.key === 'F12') {
        e.preventDefault();
        triggerWarning('Developer tools shortcut detected.');
      }
      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        triggerWarning('Developer tools shortcut detected.');
      }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        triggerWarning('View source shortcut detected.');
      }
      // Block copy/paste shortcuts
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        triggerWarning('Copy/Paste shortcuts are disabled.');
      }
    };

    const blockContextMenu = (e) => {
      e.preventDefault();
      triggerWarning('Right-click is disabled during the assessment.');
    };

    const blockCopyPaste = (e) => {
      e.preventDefault();
      triggerWarning('Copy and Paste actions are disabled.');
    };

    // Attach Event Listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', blockKeys);
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('copy', blockCopyPaste);
    document.addEventListener('paste', blockCopyPaste);

    return () => {
      // Cleanup
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('copy', blockCopyPaste);
      document.removeEventListener('paste', blockCopyPaste);
    };
  }, [isAssessmentActive, triggerWarning]);

  if (!isAssessmentActive) return <>{children}</>;

  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Security Check</h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            This assessment is strictly proctored. You must enter fullscreen mode to continue. Any attempt to switch tabs, minimize the browser, or use developer tools will be recorded as a violation.
          </p>
          <button 
            onClick={enforceFullscreen}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-900/50"
          >
            Enter Fullscreen & Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 select-none">
      {/* Warning Overlay */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl border-2 border-red-500 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Violation Detected
            </h3>
            <p className="text-slate-700 whitespace-pre-line mb-6 font-medium">{warningMessage}</p>
            {warnings < MAX_WARNINGS && (
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  enforceFullscreen();
                }}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
              >
                I Understand, Return to Assessment
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actual Assessment Content */}
      <div className={`h-full w-full transition-opacity duration-300 ${showWarningModal ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  );
}
