'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export default function ProctoringWrapper({ 
  children, 
  onAutoSubmit, 
  isAssessmentActive,
  violationsTracker,
  setViolationsTracker
}) {
  const [warningMessage, setWarningMessage] = useState('');
  const [violationType, setViolationType] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const lastWidth = useRef(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const lastHeight = useRef(typeof window !== 'undefined' ? window.innerHeight : 800);
  const isFullscreenTransition = useRef(false);

  // Filter out mobile/tablets
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobileUA = /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 1024;
      setIsMobile(isMobileUA || isSmallScreen);
    }
  }, []);

  const triggerWarning = useCallback((type, message) => {
    if (!isAssessmentActive) return;

    setViolationsTracker((prev) => {
      const updated = { ...prev };
      
      // Update specific counters and deduct integrity score
      if (type.includes('Tab') || type.includes('Blur')) {
        updated.tabSwitchCount += 1;
        updated.integrityScore = Math.max(0, updated.integrityScore - 20);
      } else if (type.includes('Fullscreen')) {
        updated.fullscreenExitCount += 1;
        updated.integrityScore = Math.max(0, updated.integrityScore - 20);
      } else if (type.includes('DevTools') || type.includes('Source') || type.includes('Resize')) {
        updated.devtoolsAttemptCount += 1;
        updated.integrityScore = Math.max(0, updated.integrityScore - 20);
      } else if (type.includes('Clipboard') || type.includes('Copy') || type.includes('Paste') || type.includes('Right-Click')) {
        updated.clipboardAttemptCount += 1;
        updated.integrityScore = Math.max(0, updated.integrityScore - 10);
      }

      updated.totalCount += 1;

      // Handle Warning display message
      setWarningMessage(message);
      setViolationType(type);
      setShowWarningModal(true);

      // Trigger auto-submit on 3rd violation
      if (updated.totalCount >= 3) {
        setWarningMessage('Maximum security warnings exceeded. Automatically submitting assessment.');
        setTimeout(() => {
          onAutoSubmit('violation');
        }, 3000);
      }

      return updated;
    });
  }, [isAssessmentActive, onAutoSubmit, setViolationsTracker]);

  const enforceFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.log('Fullscreen failed:', err));
    }
    setIsFullscreen(true);
  };

  // Clear clipboard on test start
  useEffect(() => {
    if (isAssessmentActive) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('');
        }
      } catch (err) {
        console.warn('Clipboard clear blocked:', err);
      }
    }
  }, [isAssessmentActive]);

  // Main Proctoring Listeners
  useEffect(() => {
    if (!isAssessmentActive) return;

    // 1. Tab Switch / Minimize
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerWarning(
          'Tab Switch / Minimize', 
          violationsTracker.totalCount === 0
            ? 'Please remain on the assessment page.'
            : 'One more tab switch will automatically submit your assessment.'
        );
      }
    };

    // 2. Window Blur (focus shifted away)
    const handleBlur = () => {
      triggerWarning(
        'Window Focus Lost', 
        violationsTracker.totalCount === 0
          ? 'Please remain on the assessment page.'
          : 'One more violation will automatically submit your assessment.'
      );
    };

    // 3. Fullscreen Exit
    const handleFullscreenChange = () => {
      isFullscreenTransition.current = true;
      setTimeout(() => {
        isFullscreenTransition.current = false;
      }, 1000);

      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        triggerWarning(
          'Fullscreen Exit', 
          violationsTracker.totalCount === 0
            ? 'Full Screen mode is required during the assessment.'
            : 'One more violation will automatically submit your assessment.'
        );
      } else {
        setIsFullscreen(true);
      }
    };

    // 4. Keyboard shortcuts (F12, View Source, Developer Tools, Copy/Paste)
    const blockKeys = (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        triggerWarning('DevTools Attempt', 'Developer tools are not allowed during assessment.');
      }
      // Ctrl+Shift+I, Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        triggerWarning('DevTools Attempt', 'Developer tools are not allowed during assessment.');
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        triggerWarning('View Source Attempt', 'Developer tools are not allowed during assessment.');
      }
      // Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        triggerWarning('Clipboard Interaction', 'Copy, Paste, and Cut operations are not allowed during assessment.');
      }
    };

    // 5. Right Click
    const blockContextMenu = (e) => {
      e.preventDefault();
      triggerWarning('Right-Click Attempt', 'Copy, Paste, and Cut operations are not allowed during assessment.');
    };

    // 6. Clipboard events (Copy, Paste, Cut)
    const blockClipboardEvents = (e) => {
      e.preventDefault();
      triggerWarning('Clipboard Interaction', 'Copy, Paste, and Cut operations are not allowed during assessment.');
    };

    // 7. Docked DevTools Resize Detection
    const handleResize = () => {
      if (document.fullscreenElement) return;

      const widthDiff = Math.abs(window.innerWidth - lastWidth.current);
      const heightDiff = Math.abs(window.innerHeight - lastHeight.current);

      if ((widthDiff > 150 || heightDiff > 150) && !isFullscreenTransition.current) {
        triggerWarning(
          'DevTools Dock Detection / Resize', 
          'Significant viewport resize detected. Docked developer tools are not allowed.'
        );
      }

      lastWidth.current = window.innerWidth;
      lastHeight.current = window.innerHeight;
    };

    // Attach all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', blockKeys);
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('copy', blockClipboardEvents);
    document.addEventListener('paste', blockClipboardEvents);
    document.addEventListener('cut', blockClipboardEvents);
    window.addEventListener('resize', handleResize);

    return () => {
      // Cleanup all event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('copy', blockClipboardEvents);
      document.removeEventListener('paste', blockClipboardEvents);
      document.removeEventListener('cut', blockClipboardEvents);
      window.removeEventListener('resize', handleResize);
    };
  }, [isAssessmentActive, violationsTracker.totalCount, triggerWarning]);

  // Blocking view for mobile devices
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[1000] bg-slate-900 flex flex-col items-center justify-center text-white p-8 text-center">
        <div className="bg-slate-800 p-8 rounded-3xl max-w-md w-full border border-slate-700 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-2xl font-black mb-3 text-red-400">Desktop Only Mode</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
            Assessments can only be attended from a desktop or laptop computer.
          </p>
          <p className="text-slate-400 text-xs leading-normal">
            Mobile devices and tablets are not supported due to strict proctoring and window monitoring guidelines.
          </p>
        </div>
      </div>
    );
  }

  // Pre-test fullscreen enforcer overlay
  if (isAssessmentActive && !isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center select-none">
        <div className="bg-slate-800 p-8 rounded-[2rem] max-w-md w-full border border-slate-700 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15"></path></svg>
          </div>
          <h2 className="text-2xl font-black mb-3">Fullscreen Enforced</h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed font-semibold">
            This assessment is strictly proctored. You must enter full screen mode to start or resume.
          </p>
          <button 
            onClick={enforceFullscreen}
            className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Enter Fullscreen Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-screen overflow-hidden bg-slate-50"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Warning Dialog Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-white p-8 rounded-[2rem] max-w-md w-full shadow-2xl border-2 border-red-500 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 mb-1">Assessment Security Warning</h3>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-4">
              Violation: {violationType}
            </span>

            <p className="text-slate-600 text-sm leading-relaxed mb-6 font-semibold">
              {warningMessage}
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 flex justify-between items-center mb-8">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Warning Count</span>
                <span className="text-lg font-black text-slate-800">{violationsTracker.totalCount} / 2</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-right">Remaining Attempts</span>
                <span className="text-sm font-extrabold text-red-600 text-right block">
                  {Math.max(0, 2 - violationsTracker.totalCount)} attempt(s) left
                </span>
              </div>
            </div>

            {violationsTracker.totalCount < 3 && (
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  enforceFullscreen();
                }}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-850 transition-colors text-sm shadow-md"
              >
                I Understand, Return to Assessment
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actual Assessment Container */}
      <div className={`h-full w-full transition-opacity duration-300 ${showWarningModal ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  );
}
