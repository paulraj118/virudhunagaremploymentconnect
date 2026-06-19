'use client';

import { useState, useEffect, useRef } from 'react';
import ProctoringWrapper from '@/components/assessment/ProctoringWrapper';
import { useRouter } from 'next/navigation';

export default function AssessmentPage() {
  const router = useRouter();

  // Core assessment states
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState(null);

  // Runner state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionIdx]: selectedOptionIdx }
  const [visited, setVisited] = useState({ 0: true }); // { [questionIdx]: boolean }
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('assessmentTimeLeft');
      return saved ? parseInt(saved) : 420; // 7 minutes
    }
    return 420;
  });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warningsCount, setWarningsCount] = useState(0);

  // Timer Ref
  const timerRef = useRef(null);

  // Fetch status or result on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/student/assessment');
        const data = await res.json();
        
        if (data.success) {
          if (data.completed) {
            setIsFinished(true);
            setResult(data.result);
          } else {
            setQuestions(data.questions || []);
          }
        } else {
          setError(data.message || 'Unable to load assessment.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch assessment. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isActive || isFinished) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit('timeout');
          if (typeof window !== 'undefined') sessionStorage.removeItem('assessmentTimeLeft');
          return 0;
        }
        if (typeof window !== 'undefined') sessionStorage.setItem('assessmentTimeLeft', prev - 1);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isActive, isFinished]);

  const startAssessment = () => {
    setIsActive(true);
    // Mark first question as visited
    setVisited({ 0: true });
  };

  // Auto-submit (timeout or security violation)
  const handleAutoSubmit = async (reason) => {
    setIsActive(false);
    setIsFinished(true);
    setSubmitting(true);

    try {
      const formattedAnswers = questions.map((q, idx) => ({
        questionText: q.questionText,
        selectedOption: answers[idx] !== undefined ? answers[idx] : -1
      }));

      const res = await fetch('/api/student/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: formattedAnswers,
          autoSubmitted: true,
          violations: reason === 'violation' ? 3 : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.message || 'Error occurred during auto-submission.');
      }
      if (typeof window !== 'undefined') sessionStorage.removeItem('assessmentTimeLeft');
    } catch (err) {
      console.error('Auto-submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Manual submission handler
  const handleManualSubmit = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);
    setIsActive(false);
    setIsFinished(true);

    try {
      const formattedAnswers = questions.map((q, idx) => ({
        questionText: q.questionText,
        selectedOption: answers[idx] !== undefined ? answers[idx] : -1
      }));

      const res = await fetch('/api/student/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: formattedAnswers,
          autoSubmitted: false,
          violations: 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.message || 'Failed to submit test.');
      }
      if (typeof window !== 'undefined') sessionStorage.removeItem('assessmentTimeLeft');
    } catch (err) {
      console.error('Manual submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectOption = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleClearSelection = () => {
    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[currentQuestionIndex];
      return updated;
    });
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setVisited((prev) => ({ ...prev, [nextIndex]: true }));
    } else {
      // Last question: open final confirmation modal
      setShowSubmitModal(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setVisited((prev) => ({ ...prev, [prevIndex]: true }));
    }
  };

  const handleSelectQuestion = (index) => {
    setCurrentQuestionIndex(index);
    setVisited((prev) => ({ ...prev, [index]: true }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading assessment data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-3xl p-8 text-center shadow-lg shadow-red-500/5">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Restrained</h2>
        <p className="text-slate-600 mb-6 font-medium">{error}</p>
        <button 
          onClick={() => router.push('/student')} 
          className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition-all shadow-md"
        >
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  // Finished Assessment / Result Screen
  if (isFinished && result) {
    const isPass = result.passFail === 'Pass';
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6">
        <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100/60 overflow-hidden relative group">
          {/* Decorative Top Glow */}
          <div className={`absolute top-0 left-0 w-full h-2 ${isPass ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left/Top Banner Side */}
            <div className={`lg:col-span-5 p-10 md:p-14 flex flex-col items-center justify-center relative overflow-hidden ${isPass ? 'bg-gradient-to-b from-emerald-50/50 to-white' : 'bg-gradient-to-b from-rose-50/50 to-white'}`}>
              <div className={`absolute w-72 h-72 rounded-full blur-3xl opacity-20 -top-20 -left-20 ${isPass ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
              <div className={`absolute w-72 h-72 rounded-full blur-3xl opacity-20 -bottom-20 -right-20 ${isPass ? 'bg-teal-400' : 'bg-red-400'}`}></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl backdrop-blur-md transform transition-transform group-hover:scale-105 duration-500 ${isPass ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-rose-500 shadow-rose-500/40'}`}>
                  {isPass ? (
                    <svg className="w-16 h-16 text-white drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-16 h-16 text-white drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                
                <h1 className={`text-4xl font-black text-center mb-4 tracking-tight ${isPass ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isPass ? 'Passed!' : 'Failed!'}
                </h1>
                
                <p className="text-slate-500 text-center text-base font-medium leading-relaxed max-w-[280px]">
                  {result.violations >= 3 
                    ? 'Terminated due to multiple proctoring violations.' 
                    : isPass 
                      ? 'Outstanding performance! You have proven your technical expertise.' 
                      : 'You fell short of the minimum 70% requirement. Keep practicing!'}
                </p>
              </div>
            </div>

            {/* Right/Bottom Content Side */}
            <div className="lg:col-span-7 p-10 md:p-14 lg:pl-16 lg:border-l border-slate-100 flex flex-col justify-center bg-white z-10 relative">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-10 mb-12">
                {/* Circular Progress */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle cx="72" cy="72" r="62" className="text-slate-100" strokeWidth="14" fill="transparent" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="62" 
                      className={`transition-all duration-1500 ease-out drop-shadow-sm ${isPass ? 'text-emerald-500' : 'text-rose-500'}`} 
                      strokeWidth="14" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 62} 
                      strokeDashoffset={2 * Math.PI * 62 * (1 - result.percentage / 100)} 
                      strokeLinecap="round" 
                      stroke="currentColor" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center inset-0">
                    <span className="text-4xl font-black text-slate-800 tracking-tight">{result.percentage}%</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Score</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center w-full">
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2.5">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Correct Answers</span>
                      <span className="text-xl font-black text-slate-800">{result.correctAnswers} <span className="text-sm font-bold text-slate-400">/ {result.totalQuestions}</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isPass ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${(result.correctAnswers / result.totalQuestions) * 100}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl p-4 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Domain</span>
                      <span className="font-bold text-slate-700 text-lg">{result.domain}</span>
                    </div>
                    <div className="bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl p-4 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Warnings</span>
                      <span className={`font-bold text-lg ${result.violations > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{result.violations} / 3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                <button 
                  onClick={() => router.push('/student')} 
                  className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Dashboard
                </button>
                {isPass && (
                  <button 
                    onClick={() => router.push('/student/jobs')} 
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                  >
                    Find Jobs
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-Test Rules View
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <ProctoringWrapper isAssessmentActive={isActive} onAutoSubmit={handleAutoSubmit}>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        
        {!isActive ? (
          <div className="flex-1 flex items-center justify-center p-6 md:p-12">
            <div className="max-w-3xl w-full bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-200/60 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">Proctored Assessment</h1>
                  <p className="text-slate-400 font-semibold text-sm uppercase tracking-wider">Domain Specific Competency Check</p>
                </div>
              </div>

              <div className="prose text-slate-600 space-y-4 mb-8 leading-relaxed">
                <p className="text-lg font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  You are about to launch the official screening assessment. Please read the security guidelines carefully before beginning.
                </p>
                
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                  Rules and Regulations:
                </h3>
                <ul className="space-y-3 pl-1 font-medium text-sm">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Proctoring Mode:</strong> You must enter and stay in full-screen mode. Exiting full-screen will trigger warning logs.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Window Switching:</strong> Minimizing the browser or shifting tabs will log warnings. <strong>Exceeding 3 warnings results in auto-failure.</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Key Actions:</strong> Right-click, developer console shortcuts (F12, Ctrl+Shift+I), view source, copy/paste are completely blocked.</span>
                  </li>
                </ul>

                <h3 className="font-extrabold text-slate-800 text-lg pt-2 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                  Structure & Guidelines:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-semibold text-center text-sm">
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
                    <p className="text-indigo-600 text-2xl font-black mb-1">10</p>
                    <p className="text-slate-500 text-xs">Total MCQs</p>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
                    <p className="text-indigo-600 text-2xl font-black mb-1">7m</p>
                    <p className="text-slate-500 text-xs">Time Limit</p>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
                    <p className="text-indigo-600 text-2xl font-black mb-1">70%</p>
                    <p className="text-slate-500 text-xs">Passing Grade</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={startAssessment}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-lg transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5"
              >
                Accept Rules & Start Assessment
              </button>
            </div>
          </div>
        ) : (
          // Active Assessment View
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar Navigation */}
            <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-8 shadow-sm flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-indigo-100">
                  {currentQuestion?.domain || 'React'}
                </span>
                <span className="hidden sm:inline text-slate-400 font-bold">|</span>
                <h2 className="text-slate-700 font-extrabold text-sm tracking-tight hidden sm:block">Proctored Assessment Session</h2>
              </div>
              
              <div className="flex items-center gap-6">
                {/* Live Countdown Timer */}
                <div className={`flex items-center gap-2 px-4.5 py-2 rounded-2xl border font-bold ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="text-lg font-black font-mono">{formatTime(timeLeft)}</span>
                </div>

                <button 
                  onClick={() => setShowSubmitModal(true)} 
                  className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-sm shadow-rose-200/50"
                >
                  Submit Test
                </button>
              </div>
            </header>

            {/* Main Content Workspace Layout */}
            <main className="flex-1 flex overflow-hidden min-h-0 bg-slate-50/50">
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">
                
                {/* Left Side: Question Presentation Panel */}
                <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
                  
                  {/* Progress Indicator */}
                  <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-extrabold text-sm uppercase tracking-wide">Question</span>
                      <span className="text-slate-800 text-lg font-black">{currentQuestionIndex + 1}</span>
                      <span className="text-slate-400 font-bold">of</span>
                      <span className="text-slate-400 font-bold">{questions.length}</span>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      currentQuestion?.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' :
                      currentQuestion?.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {currentQuestion?.difficulty}
                    </span>
                  </div>

                  {/* Question Scrollable viewport */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    <h2 className="text-slate-800 font-extrabold text-xl md:text-2xl leading-snug">
                      {currentQuestion?.questionText}
                    </h2>

                    {/* Radio Options Grid */}
                    <div className="space-y-4 pt-2">
                      {currentQuestion?.options.map((option, i) => {
                        const isSelected = answers[currentQuestionIndex] === i;
                        const optionLabels = ['A', 'B', 'C', 'D'];
                        
                        return (
                          <label 
                            key={i} 
                            onClick={() => handleSelectOption(i)}
                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none ${
                              isSelected 
                                ? 'bg-indigo-50/70 border-indigo-600 shadow-sm shadow-indigo-600/5' 
                                : 'bg-white border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm transition-colors border ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}>
                              {optionLabels[i]}
                            </div>
                            <span className={`font-semibold text-[15px] ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {option}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Navigation Toolbar */}
                  <div className="bg-slate-50 px-6 py-5 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button 
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white font-bold px-5 py-3 rounded-xl transition-all shadow-sm text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                      Previous
                    </button>

                    <button 
                      onClick={handleClearSelection}
                      className="text-slate-500 hover:text-slate-700 font-bold px-4 py-2 hover:bg-slate-200/50 rounded-xl transition-colors text-sm"
                    >
                      Clear Selection
                    </button>

                    <button 
                      onClick={handleSaveAndNext}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:translate-y-px text-sm"
                    >
                      {currentQuestionIndex === questions.length - 1 ? 'Save & Submit' : 'Save & Next'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>

                {/* Right Side: Side Palette Panel */}
                <aside className="w-full md:w-80 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-0 select-none">
                  <h3 className="font-extrabold text-slate-800 text-lg tracking-tight mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-indigo-600 rounded-full"></span>
                    Question Palette
                  </h3>

                  {/* Bubbles Grid */}
                  <div className="flex-1 overflow-y-auto mb-6 pr-1">
                    <div className="grid grid-cols-5 gap-3.5">
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
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm border-2 transition-all cursor-pointer relative ${bubbleClass} ${
                              isCurrent ? 'ring-4 ring-indigo-600/20 border-indigo-600 scale-105 z-10' : ''
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legends List */}
                  <div className="border-t border-slate-100 pt-5 space-y-3 shrink-0">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legend</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-indigo-600 border border-indigo-600 rounded-md"></span>
                        <span>Answered</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-amber-100 border border-amber-300 rounded-md"></span>
                        <span>Skipped</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <span className="w-4 h-4 bg-white border-2 border-slate-200 rounded-md"></span>
                        <span>Not Visited</span>
                      </div>
                    </div>
                  </div>
                </aside>

              </div>
            </main>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>

              <h3 className="text-2xl font-black text-slate-800 mb-2">Finish Assessment?</h3>
              <p className="text-slate-500 font-medium text-[15px] mb-6 leading-relaxed">
                Are you sure you want to submit your assessment? You have answered <strong>{Object.keys(answers).length}</strong> of <strong>{questions.length}</strong> questions. You cannot change your answers once submitted.
              </p>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowSubmitModal(false)} 
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold py-3.5 rounded-xl transition-all shadow-sm text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleManualSubmit}
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:translate-y-px text-sm disabled:opacity-50"
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
