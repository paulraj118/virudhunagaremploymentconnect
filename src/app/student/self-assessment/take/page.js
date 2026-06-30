'use client';

import { useState, useEffect, useRef } from 'react';
import ProctoringWrapper from '@/components/assessment/ProctoringWrapper';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SelfAssessmentTakePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = searchParams.get('level');
  const requestedDomain = searchParams.get('domain');

  // Core assessment states
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [domain, setDomain] = useState('');

  // Runner state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionIdx]: selectedOptionIdx }
  const [visited, setVisited] = useState({ 0: true }); // { [questionIdx]: boolean }
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes default
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Proctoring and Session integrity states
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  
  const [violationsTracker, setViolationsTracker] = useState({
    tabSwitchCount: 0,
    fullscreenExitCount: 0,
    devtoolsAttemptCount: 0,
    clipboardAttemptCount: 0,
    totalCount: 0,
    integrityScore: 100
  });

  // Timer and Scroll Refs
  const timerRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!level) {
      router.push('/student/self-assessment');
      return;
    }
    fetchQuestions();
  }, [level, router]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const domainQuery = requestedDomain ? `&domain=${encodeURIComponent(requestedDomain)}` : '';
      const res = await fetch(`/api/student/self-assessment/questions?level=${level}${domainQuery}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch questions');
      }

      setQuestions(data.questions);
      setDomain(data.domain);
      setTimeLeft(data.timeLimit || 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async () => {
    setIsAgreementAccepted(true);
    setIsActive(true);
    setStartTime(new Date().toISOString());

    // Enforce Fullscreen via document element directly as fallback
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }

    // Start strict timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit('time_up');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOptionSelect = (optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleSelectQuestion = (index) => {
    setVisited(prev => ({ ...prev, [index]: true }));
    setCurrentQuestionIndex(index);
    scrollToBottom();
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setVisited(prev => ({ ...prev, [nextIdx]: true }));
      setCurrentQuestionIndex(nextIdx);
      scrollToBottom();
    } else {
      setShowSubmitModal(true);
    }
  };

  const handleManualSubmit = () => {
    setShowSubmitModal(false);
    submitAssessment('manual');
  };

  const handleAutoSubmit = (reason) => {
    submitAssessment(reason);
  };

  const submitAssessment = async (reason = 'manual') => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    setIsActive(false);

    try {
      // Format answers to match POST API expectation
      const formattedAnswers = questions.map((q, i) => ({
        selectedOptionIndex: answers[i] !== undefined ? answers[i] : -1
      }));

      const payload = {
        level,
        answers: formattedAnswers,
        startTime,
        questionIds: questions.map(q => q._id)
      };

      const res = await fetch('/api/student/self-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submit failed');

      setIsFinished(true);
      setResult(data);
    } catch (err) {
      setError(err.message);
      // Give them a chance to retry manual submit if API fails
      setSubmitting(false);
      setIsActive(true);
    }
  };

  // Format Time Helper
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // === RENDER STATES ===

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse text-lg tracking-tight">Preparing your assessment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Assessment Unavailable</h2>
          <p className="text-red-600 font-medium mb-6 text-[15px]">{error}</p>
          <button 
            onClick={() => router.push('/student/self-assessment')}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isFinished && result) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-indigo-100">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-lg w-full text-center border border-slate-100 animate-in zoom-in-95 duration-500 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>

          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100/50">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Assessment Complete!</h2>
          <p className="text-slate-500 font-medium mb-8 text-[15px] leading-relaxed">
            Your answers have been submitted successfully. Our AI engine is generating your detailed performance report.
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Score</p>
                <p className="text-2xl font-black text-slate-800">{result.percentage}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Result</p>
                <p className={`text-xl font-black ${result.passFail === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {result.passFail}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => router.replace(`/student/self-assessment/report?id=${result.resultId}`)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:translate-y-px text-[15px] flex items-center justify-center gap-2"
          >
            View Detailed Report
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProctoringWrapper 
      onAutoSubmit={handleAutoSubmit} 
      isAssessmentActive={isActive}
      violationsTracker={violationsTracker}
      setViolationsTracker={setViolationsTracker}
    >
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-100 flex flex-col">
        
        {/* Pre-Assessment Agreement Screen */}
        {!isAgreementAccepted && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
              <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h1 className="text-3xl font-black tracking-tight mb-2 relative z-10">Self Assessment</h1>
                <p className="text-slate-300 font-medium relative z-10 text-[15px] max-w-lg">
                  Level: <span className="capitalize font-bold text-white">{level}</span> | Domain: <span className="font-bold text-white">{domain}</span>
                </p>
              </div>
              
              <div className="p-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Proctoring Rules & Instructions
                </h2>
                
                <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                  <ul className="space-y-4 text-[14px] text-slate-650 font-medium">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs">1</span>
                      <span>Do not exit fullscreen mode. Exiting will trigger a violation warning.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs">2</span>
                      <span>Do not switch tabs or minimize the browser. Focus tracking is enabled.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs">3</span>
                      <span>Copying, pasting, and Developer Tools are strictly disabled.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">!</span>
                      <span>3 security violations will result in automatic submission.</span>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Questions</p>
                    <p className="text-2xl font-black text-slate-800">{questions.length}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Time Limit</p>
                    <p className="text-2xl font-black text-slate-800">{questions.length} Mins</p>
                  </div>
                </div>

                <button 
                  onClick={startAssessment}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:translate-y-px text-[15px]"
                >
                  I Understand, Start Assessment Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Assessment Runner */}
        {isActive && !isFinished && (
          <div className="flex-1 flex flex-col md:h-screen md:overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-md relative z-20">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="font-bold tracking-tight text-sm sm:text-[15px]">
                    Self Assessment - <span className="text-indigo-400 capitalize">{level} Level</span>
                  </h1>
                  <p className="text-slate-400 text-[10px] sm:text-xs font-medium mt-0.5">{domain}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 sm:gap-6">
                <div className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-all duration-300 ${
                  timeLeft < 300 
                    ? 'bg-red-950/40 border-red-500 text-red-400 animate-pulse' 
                    : 'bg-slate-800 border-slate-700 text-slate-100'
                }`}>
                  <svg className={`w-4 h-4 ${timeLeft < 300 ? 'text-red-400' : 'text-indigo-400'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="font-mono text-sm sm:text-base font-extrabold tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                
                <button 
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm shadow-md shadow-red-500/20"
                >
                  Finish
                </button>
              </div>
            </header>
 
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row p-4 md:p-6 gap-6 max-w-7xl mx-auto w-full">
              
              {/* Left Side: Question Panel */}
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[400px] md:min-h-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
 
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-10 custom-scrollbar">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-xs tracking-wide">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold tracking-wide capitalize">
                      {questions[currentQuestionIndex].topic}
                    </span>
                  </div>
 
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-relaxed mb-8 break-words selection:bg-indigo-100">
                    {questions[currentQuestionIndex].questionText}
                  </h2>
 
                  <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map((option, idx) => {
                      const isSelected = answers[currentQuestionIndex] === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleOptionSelect(idx)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group flex gap-3.5 items-start select-none ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                          </div>
                          <span className={`text-sm sm:text-[15px] leading-relaxed font-medium break-words ${isSelected ? 'text-indigo-900 font-semibold' : 'text-slate-700'}`}>
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div ref={bottomRef} className="h-4"></div>
                </div>
 
                <div className="bg-slate-50 p-4 md:p-5 border-t border-slate-200 flex items-center justify-between shrink-0 gap-4">
                  <button 
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        setCurrentQuestionIndex(prev => prev - 1);
                      }
                    }}
                    disabled={currentQuestionIndex === 0}
                    className="text-slate-500 hover:text-slate-800 font-bold px-4 py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                    Previous
                  </button>
 
                  <button 
                    onClick={handleSaveAndNext}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:translate-y-px text-xs sm:text-sm"
                  >
                    {currentQuestionIndex === questions.length - 1 ? 'Save & Submit' : 'Save & Next'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              </div>
 
              {/* Right Side: Side Palette Panel */}
              <aside className="w-full md:w-80 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col shrink-0 select-none">
                <h3 className="font-extrabold text-slate-800 text-base tracking-tight mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-indigo-600 rounded-full"></span>
                  Question Palette
                </h3>
 
                <div className="flex-1 overflow-y-auto mb-6 pr-1 custom-scrollbar max-h-48 md:max-h-none">
                  <div className="grid grid-cols-5 gap-2.5">
                    {questions.map((_, i) => {
                      const isCurrent = currentQuestionIndex === i;
                      const isAnswered = answers[i] !== undefined;
                      const isVis = visited[i];
                      
                      let bubbleClass = 'border-slate-200 hover:border-slate-400 text-slate-600';
                      if (isAnswered) {
                        bubbleClass = 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700';
                      } else if (isVis) {
                        bubbleClass = 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200';
                      }
 
                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectQuestion(i)}
                          className={`w-9.5 h-9.5 rounded-lg flex items-center justify-center font-extrabold text-xs border-2 transition-all cursor-pointer relative ${bubbleClass} ${
                            isCurrent ? 'ring-4 ring-indigo-600/20 border-indigo-600 scale-105 z-10' : ''
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
 
                <div className="border-t border-slate-100 pt-4 space-y-3 shrink-0">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legend</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-650">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 bg-indigo-600 border border-indigo-600 rounded"></span>
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 bg-amber-100 border border-amber-300 rounded"></span>
                      <span>Skipped</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <span className="w-3.5 h-3.5 bg-white border-2 border-slate-200 rounded"></span>
                      <span>Not Visited</span>
                    </div>
                  </div>
                </div>
              </aside>
 
            </main>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 select-none">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>

              <h3 className="text-2xl font-black text-slate-800 mb-2">Finish Assessment?</h3>
              <p className="text-slate-500 font-medium text-[15px] mb-6 leading-relaxed font-semibold">
                Are you sure you want to submit your assessment? You have answered <strong>{Object.keys(answers).length}</strong> of <strong>{questions.length}</strong> questions. You cannot change your answers once submitted.
              </p>

              <div className="flex gap-4 font-bold text-sm">
                <button 
                  onClick={() => setShowSubmitModal(false)} 
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100 py-3.5 rounded-xl transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleManualSubmit}
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl transition-all shadow-md active:translate-y-px disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Yes, Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProctoringWrapper>
  );
}
