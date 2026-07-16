'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';

export default function TechnicalTestEnginePage() {
  const { applicationId } = useParams();
  const router = useRouter();
  
  // Test State
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Answers State
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [fillAnswers, setFillAnswers] = useState({});
  const [prog1, setProg1] = useState({ code: '', languageId: 'javascript' });
  const [prog2, setProg2] = useState({ code: '', languageId: 'javascript' });
  
  // Engine State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingMsg, setSavingMsg] = useState('');
  
  // Anti-Cheating State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningMsg, setWarningMsg] = useState(null);
  const [warningCount, setWarningCount] = useState(0);

  const autoSaveTimerRef = useRef(null);
  const submissionTriggered = useRef(false);
  const broadcastChannelRef = useRef(null);

  // Initialize and Fetch
  useEffect(() => {
    fetchTestState();
  }, [applicationId]);

  const fetchTestState = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/technical-test/pending', { cache: 'no-store' });
      const json = await res.json();
      
      if (json.success) {
        const testItem = json.data.tests.find(t => t.applicationId === applicationId);
        if (testItem) {
          if (['Completed', 'Pass', 'Fail'].includes(testItem.technicalTestStatus) || ['Completed', 'Terminated'].includes(testItem.attempt?.status)) {
            router.replace(`/student/technical-test/${applicationId}/result`);
            return;
          }
          if (testItem.technicalTestStatus !== 'In Progress') {
            router.replace(`/student/technical-test/${applicationId}`);
            return;
          }
          
          initializeEngine(testItem);
        } else {
          setError('Test not found.');
        }
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError('Server error while initializing test engine.');
    } finally {
      setLoading(false);
    }
  };

  const initializeEngine = (data) => {
    setTestData(data);
    
    // Flatten Questions
    const qs = [];
    const sections = data.technicalTest.sections;
    
    // MCQs (0-4)
    (sections.sectionA_MCQ || []).forEach((q, i) => {
      qs.push({ type: 'mcq', index: i, globalIndex: qs.length, data: q });
    });
    // Fill Blanks (5-9)
    (sections.sectionB_FillBlanks || []).forEach((q, i) => {
      qs.push({ type: 'fill', index: i, globalIndex: qs.length, data: q });
    });
    // Prog 1 (10)
    if (sections.sectionC_Programming1) {
      qs.push({ type: 'prog1', index: 0, globalIndex: qs.length, data: sections.sectionC_Programming1 });
    }
    // Prog 2 (11)
    if (sections.sectionD_Programming2) {
      qs.push({ type: 'prog2', index: 0, globalIndex: qs.length, data: sections.sectionD_Programming2 });
    }
    
    setQuestions(qs);
    
    // Restore Answers
    const attempt = data.attempt;
    if (attempt && attempt.answers) {
      if (attempt.answers.mcq) setMcqAnswers(attempt.answers.mcq);
      if (attempt.answers.fillBlanks) setFillAnswers(attempt.answers.fillBlanks);
      if (attempt.answers.programming1) {
        setProg1({
          code: attempt.answers.programming1.code || '',
          languageId: attempt.answers.programming1.languageId || 'javascript'
        });
      }
      if (attempt.answers.programming2) {
        setProg2({
          code: attempt.answers.programming2.code || '',
          languageId: attempt.answers.programming2.languageId || 'javascript'
        });
      }
    }

    // Initialize Timer
    const startedAt = new Date(attempt.browserStartedAt).getTime();
    const durationMs = data.technicalTest.duration * 60 * 1000;
    const elapsedMs = Date.now() - startedAt;
    const remainingSec = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));
    setTimeLeft(remainingSec);
  };

  // Timer Tick
  useEffect(() => {
    if (timeLeft === null || submitting) return;

    if (timeLeft <= 0 && !submissionTriggered.current) {
      submissionTriggered.current = true;
      handleSubmit(true); // Auto submit
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!submissionTriggered.current) {
            submissionTriggered.current = true;
            handleSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting]);

  // Auto Save Setup (Every 30s)
  useEffect(() => {
    if (!testData || submitting) return;
    
    autoSaveTimerRef.current = setInterval(() => {
      saveProgress(false);
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [testData, mcqAnswers, fillAnswers, prog1, prog2, submitting]);

  const saveProgress = async (showUi = true) => {
    if (!testData || !testData.attempt) return;
    
    if (showUi) setSavingMsg('Saving...');
    try {
      const payload = {
        attemptId: testData.attempt._id,
        answers: {
          mcq: mcqAnswers,
          fillBlanks: fillAnswers,
          programming1: prog1,
          programming2: prog2
        }
      };
      
      const res = await fetch('/api/student/technical-test/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (showUi && res.ok) {
        setSavingMsg('Saved');
        setTimeout(() => setSavingMsg(''), 2000);
      }
    } catch (err) {
      if (showUi) setSavingMsg('Failed to save');
    }
  };

  const handleSubmit = async (isAuto = false) => {
    if (submitting) return;
    
    if (!isAuto && !confirm('Are you sure you want to submit the test? You cannot make changes after submitting.')) {
      return;
    }
    
    setSubmitting(true);
    setSavingMsg(isAuto ? 'Auto Submitting...' : 'Submitting Test...');
    
    try {
      const payload = {
        attemptId: testData.attempt._id,
        autoSubmitted: isAuto,
        submissionReason: isAuto ? (timeLeft <= 0 ? 'Time Expired' : 'Warning Limit Exceeded') : 'Manual Submission',
        answers: {
          mcq: mcqAnswers,
          fillBlanks: fillAnswers,
          programming1: prog1,
          programming2: prog2
        }
      };
      
      const res = await fetch('/api/student/technical-test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        router.replace(`/student/technical-test/${applicationId}/result`);
      } else {
        alert(data.message || 'Submission failed. Please try again.');
        setSubmitting(false);
        submissionTriggered.current = false;
      }
    } catch (err) {
      alert('Network error during submission. Please check your connection and try again.');
      setSubmitting(false);
      submissionTriggered.current = false;
    }
  };

  // Handlers
  const handleMcqChange = (index, option) => {
    setMcqAnswers(prev => ({ ...prev, [index]: option }));
  };
  
  const handleFillChange = (index, value) => {
    setFillAnswers(prev => ({ ...prev, [index]: value }));
  };

  const handleNav = (newIdx) => {
    if (newIdx >= 0 && newIdx < questions.length) {
      saveProgress(false); // Silent save on nav
      setCurrentIdx(newIdx);
    }
  };

  // Helpers
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isAnswered = (q) => {
    if (q.type === 'mcq') return !!mcqAnswers[q.index];
    if (q.type === 'fill') return !!fillAnswers[q.index] && fillAnswers[q.index].trim() !== '';
    if (q.type === 'prog1') return !!prog1.code && prog1.code.trim() !== '';
    if (q.type === 'prog2') return !!prog2.code && prog2.code.trim() !== '';
    return false;
  };

  // --- Anti-Cheating Mechanisms ---
  const reportCheating = async (eventType) => {
    if (submitting || submissionTriggered.current || !testData?.attempt?._id) return;

    try {
      const res = await fetch('/api/student/technical-test/warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: testData.attempt._id,
          eventType,
          browserVisibilityState: document.visibilityState,
          fullscreenStatus: !!document.fullscreenElement
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setWarningCount(data.data.warningCount);
        if (data.data.autoSubmitTriggered && !submissionTriggered.current) {
          submissionTriggered.current = true;
          handleSubmit(true);
        } else if (!data.data.autoSubmitTriggered) {
          if (data.data.warningCount === 1) setWarningMsg("Warning 1: Please do not exit fullscreen or switch tabs.");
          else if (data.data.warningCount === 2) setWarningMsg("Warning 2 (Final Warning): Your actions are being recorded.");
          else if (data.data.warningCount === 3) setWarningMsg("Warning 3 (LAST WARNING): One more violation will immediately submit your test.");
        }
      }
    } catch (err) {
      console.error('Failed to report cheating event', err);
    }
  };

  useEffect(() => {
    if (!testData || submitting) return;

    // 1. Multiple Tab Detection via BroadcastChannel
    broadcastChannelRef.current = new BroadcastChannel('tech_test_channel');
    broadcastChannelRef.current.postMessage({ type: 'TEST_OPENED', attemptId: testData.attempt._id });
    
    broadcastChannelRef.current.onmessage = (event) => {
      if (event.data.type === 'TEST_OPENED' && event.data.attemptId === testData.attempt._id) {
        reportCheating('MULTIPLE_TAB');
      }
    };

    // 2. Visibility / Tab Switch
    const handleVisibilityChange = () => {
      if (document.hidden) reportCheating('TAB_SWITCH');
    };
    
    // 3. Blur (Clicking outside browser)
    const handleBlur = () => {
      reportCheating('WINDOW_BLUR');
    };

    // 4. Fullscreen Exit Detection
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) reportCheating('FULLSCREEN_EXIT');
    };

    // 5. Disable Copy, Paste, Cut, ContextMenu
    const blockAction = (e, type) => {
      e.preventDefault();
      reportCheating(type);
    };
    const handleCopy = (e) => blockAction(e, 'COPY_ATTEMPT');
    const handlePaste = (e) => blockAction(e, 'PASTE_ATTEMPT');
    const handleCut = (e) => blockAction(e, 'CUT_ATTEMPT');
    const handleContextMenu = (e) => blockAction(e, 'RIGHT_CLICK');

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      if (broadcastChannelRef.current) broadcastChannelRef.current.close();
    };
  }, [testData, submitting]);

  const requestFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(err => console.error(err));
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen().catch(err => console.error(err));
    else if (el.msRequestFullscreen) el.msRequestFullscreen().catch(err => console.error(err));
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white font-medium">Initializing Test Engine...</p>
    </div>
  );

  if (error || !testData) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-sm">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Test</h2>
        <p className="text-slate-600 mb-6 font-medium">{error}</p>
        <button onClick={() => router.push('/student/technical-test')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">Return to Dashboard</button>
      </div>
    </div>
  );

  const currentQ = questions[currentIdx];

  if (testData && !isFullscreen && !submitting) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 text-center max-w-lg shadow-2xl relative z-10 animate-fade-in-up">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3">Fullscreen Required</h2>
          <p className="text-slate-600 mb-8 font-medium">To maintain test integrity, this assessment must be taken in fullscreen mode. Exiting fullscreen will trigger a warning.</p>
          <button 
            onClick={requestFullscreen} 
            className="w-full bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-transform hover:-translate-y-1 shadow-lg shadow-indigo-600/30"
          >
            Enter Fullscreen & Resume
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden select-none">
      
      {/* Warning Overlay */}
      {warningMsg && !submitting && (
        <div className="fixed inset-0 bg-red-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-2xl font-black text-red-600 mb-4">Security Warning</h2>
            <p className="text-slate-700 font-bold mb-8 text-lg bg-red-50 p-4 rounded-xl border border-red-100">{warningMsg}</p>
            <button 
              onClick={() => { setWarningMsg(null); requestFullscreen(); }} 
              className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors"
            >
              I Understand, Resume Test
            </button>
          </div>
        </div>
      )}
      
      {/* Top Bar */}
      <header className="bg-slate-900 text-white h-16 shrink-0 px-6 flex items-center justify-between shadow-md z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">
            {testData.company?.name?.charAt(0) || 'C'}
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold leading-tight">{testData.technicalTest?.jobRole}</h1>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{testData.company?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Time Left</span>
            <div className={`px-4 py-1.5 rounded-lg font-mono font-black text-lg ${timeLeft < 300 ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-slate-800 text-emerald-400'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Panel: Navigator */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto hidden md:flex">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Question Navigator</h2>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Answered</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded-sm"></div> Unanswered</span>
            </div>
          </div>
          
          <div className="p-4 flex-1">
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q) => {
                const answered = isAnswered(q);
                const active = currentIdx === q.globalIndex;
                
                let baseStyle = 'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all border-2 cursor-pointer ';
                
                if (active) {
                  baseStyle += 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm';
                } else if (answered) {
                  baseStyle += 'border-emerald-500 bg-emerald-500 text-white';
                } else {
                  baseStyle += 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300';
                }
                
                return (
                  <button 
                    key={q.globalIndex}
                    onClick={() => handleNav(q.globalIndex)}
                    className={baseStyle}
                  >
                    {q.globalIndex + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
             <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sections Overview</div>
             <div className="text-xs font-medium text-slate-600 text-left space-y-1">
               <p><span className="font-bold">1-5:</span> MCQ</p>
               <p><span className="font-bold">6-10:</span> Fill in the Blanks</p>
               <p><span className="font-bold">11-12:</span> Programming</p>
             </div>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          
          {/* Question Header */}
          <div className="bg-white border-b border-slate-200 p-6 shrink-0 flex items-center justify-between shadow-sm z-10">
            <div>
              <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                Question {currentIdx + 1} of {questions.length}
              </span>
              {currentQ?.type === 'mcq' && <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Multiple Choice</h3>}
              {currentQ?.type === 'fill' && <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Fill in the Blanks</h3>}
              {(currentQ?.type === 'prog1' || currentQ?.type === 'prog2') && <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Programming</h3>}
            </div>
            
            {/* Auto Save indicator */}
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 h-6">
              {savingMsg && (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  {savingMsg}
                </>
              )}
            </div>
          </div>

          {/* Question Content Area */}
          <div className="flex-1 overflow-y-auto relative">
            <div className={`mx-auto w-full h-full ${currentQ?.type.startsWith('prog') ? 'max-w-none p-0 flex' : 'max-w-4xl p-6 lg:p-10'}`}>
              
              {/* MCQ Renderer */}
              {currentQ?.type === 'mcq' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-lg font-bold text-slate-800 leading-relaxed mb-8">{currentQ.data.question}</p>
                  <div className="space-y-4">
                    {currentQ.data.options?.map((opt, optIndex) => {
                      const letter = ['A', 'B', 'C', 'D'][optIndex];
                      const isSelected = mcqAnswers[currentQ.index] === letter;
                      return (
                        <label 
                          key={letter} 
                          className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all group ${
                            isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4 font-bold text-sm transition-colors ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                          }`}>
                            {letter}
                          </div>
                          <input 
                            type="radio" 
                            name={`mcq-${currentQ.index}`} 
                            value={letter}
                            checked={isSelected}
                            onChange={() => handleMcqChange(currentQ.index, letter)}
                            className="hidden"
                          />
                          <span className={`text-base font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fill in the Blanks Renderer */}
              {currentQ?.type === 'fill' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-lg font-bold text-slate-800 leading-relaxed mb-8">{currentQ.data.question}</p>
                  <div className="max-w-md">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type your answer</label>
                    <input 
                      type="text" 
                      value={fillAnswers[currentQ.index] || ''}
                      onChange={(e) => handleFillChange(currentQ.index, e.target.value)}
                      placeholder="Enter exact answer..."
                      className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl text-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all bg-slate-50 focus:bg-white"
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}

              {/* Programming Renderer */}
              {currentQ?.type.startsWith('prog') && (() => {
                const progState = currentQ.type === 'prog1' ? prog1 : prog2;
                const setProgState = currentQ.type === 'prog1' ? setProg1 : setProg2;
                
                return (
                  <div className="flex w-full h-full">
                    {/* Problem Statement Pane */}
                    <div className="w-[40%] bg-white border-r border-slate-200 overflow-y-auto flex flex-col">
                      <div className="p-6">
                        <h2 className="text-xl font-black text-slate-800 mb-4">{currentQ.data.title}</h2>
                        <div className="prose prose-sm prose-slate max-w-none text-slate-600 font-medium mb-8">
                          {currentQ.data.description.split('\n').map((line, i) => (
                            <p key={i} className="mb-2">{line}</p>
                          ))}
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sample Input</h3>
                            <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono overflow-x-auto whitespace-pre-wrap">{currentQ.data.sampleInput}</pre>
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sample Output</h3>
                            <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono overflow-x-auto whitespace-pre-wrap">{currentQ.data.sampleOutput}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Editor Pane */}
                    <div className="w-[60%] flex flex-col bg-[#1e1e1e]">
                      <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-b border-[#3c3c3c]">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#4ec9b0]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                          <span className="text-[#cccccc] text-xs font-medium">Code Editor</span>
                        </div>
                        <select 
                          value={progState.languageId}
                          onChange={(e) => setProgState(prev => ({ ...prev, languageId: e.target.value }))}
                          className="bg-[#3c3c3c] text-[#cccccc] border-none text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#007fd4] cursor-pointer"
                        >
                          <option value="javascript">JavaScript (Node.js)</option>
                          <option value="python">Python 3</option>
                          <option value="java">Java (OpenJDK)</option>
                          <option value="cpp">C++ (GCC)</option>
                        </select>
                      </div>
                      <div className="flex-1 relative">
                        <Editor
                          height="100%"
                          language={progState.languageId === 'cpp' ? 'cpp' : progState.languageId}
                          theme="vs-dark"
                          value={progState.code}
                          onChange={(value) => setProgState(prev => ({ ...prev, code: value || '' }))}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineHeight: 24,
                            padding: { top: 16 },
                            scrollBeyondLastLine: false,
                            smoothScrolling: true,
                            cursorBlinking: "smooth",
                            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Bottom Bar: Navigation */}
          <div className="bg-white border-t border-slate-200 p-4 shrink-0 flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => handleNav(currentIdx - 1)}
              disabled={currentIdx === 0}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
              Previous
            </button>

            <div className="flex gap-3">
              <button 
                onClick={() => saveProgress(true)}
                className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-colors text-sm hidden sm:block"
              >
                Save Draft
              </button>
              
              {currentIdx === questions.length - 1 ? (
                <button 
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md text-sm flex items-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Submit Test'}
                  {!submitting && <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                </button>
              ) : (
                <button 
                  onClick={() => handleNav(currentIdx + 1)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-sm flex items-center gap-2"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                </button>
              )}
            </div>
          </div>
          
        </main>
      </div>

      {/* Submitting Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Submitting Your Test</h2>
            <p className="text-slate-500 text-sm font-medium">Please wait while your answers are being evaluated by our engine. This may take a few seconds.</p>
          </div>
        </div>
      )}
    </div>
  );
}
