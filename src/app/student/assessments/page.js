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
  const [studentName, setStudentName] = useState('Student');

  // Runner state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionIdx]: selectedOptionIdx }
  const [visited, setVisited] = useState({ 0: true }); // { [questionIdx]: boolean }
  const [timeLeft, setTimeLeft] = useState(840); // 14 minutes
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Proctoring and Session integrity states
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loginTimestamp, setLoginTimestamp] = useState('');
  const [systemSpecs, setSystemSpecs] = useState({});
  const [sessionBlocked, setSessionBlocked] = useState(false);
  
  const [violationsTracker, setViolationsTracker] = useState({
    tabSwitchCount: 0,
    fullscreenExitCount: 0,
    devtoolsAttemptCount: 0,
    clipboardAttemptCount: 0,
    totalCount: 0,
    integrityScore: 100
  });

  // Job application flow states
  const [appliedSuccessfully, setAppliedSuccessfully] = useState(false);
  const [pendingJobId, setPendingJobId] = useState(null);
  const [pendingJobTitle, setPendingJobTitle] = useState('');
  const [pendingJobCompany, setPendingJobCompany] = useState('');
  const [alreadyTakenJob, setAlreadyTakenJob] = useState(false);

  // Timer and Scroll Refs
  const timerRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper: Shuffle array (Fisher-Yates)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Helper: Get OS, Browser, Device, Resolution info
  const getSystemSpecs = () => {
    if (typeof window === 'undefined') return {};
    const userAgent = navigator.userAgent;
    let browserName = "Unknown Browser";
    let browserVersion = "";
    let operatingSystem = "Unknown OS";
    let deviceType = "Desktop";

    if (/chrome|crios/i.test(userAgent) && !/edge|edg/i.test(userAgent) && !/opr/i.test(userAgent)) {
      browserName = "Google Chrome";
      const match = userAgent.match(/Chrome\/([0-9.]+)/);
      if (match) browserVersion = match[1];
    } else if (/firefox|iceweasel/i.test(userAgent)) {
      browserName = "Mozilla Firefox";
      const match = userAgent.match(/Firefox\/([0-9.]+)/);
      if (match) browserVersion = match[1];
    } else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
      browserName = "Apple Safari";
    } else if (/edge|edg/i.test(userAgent)) {
      browserName = "Microsoft Edge";
    }

    if (/windows/i.test(userAgent)) operatingSystem = "Windows";
    else if (/macintosh|mac os x/i.test(userAgent)) operatingSystem = "macOS";
    else if (/linux/i.test(userAgent)) operatingSystem = "Linux";
    else if (/android/i.test(userAgent)) operatingSystem = "Android";
    else if (/iphone|ipad|ipod/i.test(userAgent)) operatingSystem = "iOS";

    if (/mobile/i.test(userAgent)) {
      deviceType = "Mobile";
    }

    return {
      browserName,
      browserVersion,
      operatingSystem,
      deviceType,
      screenResolution: `${window.screen.width}x${window.screen.height}`
    };
  };

  // Load target job on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPendingJobId(sessionStorage.getItem('pendingApplyJobId'));
      setPendingJobTitle(sessionStorage.getItem('pendingApplyJobTitle') || '');
      setPendingJobCompany(sessionStorage.getItem('pendingApplyJobCompany') || '');
    }
  }, []);

  // Fetch status or result on mount with state recovery verification
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const specs = getSystemSpecs();
        setSystemSpecs(specs);

        // Check for active proctored session in localStorage
        const savedStateStr = localStorage.getItem('activeAssessmentState');
        if (savedStateStr) {
          const savedState = JSON.parse(savedStateStr);
          
          // Verify with server using ping
          const pingRes = await fetch(`/api/student/assessment?ping=true&sessionId=${savedState.sessionId}`);
          const pingData = await pingRes.json();
          
          const currentJobId = sessionStorage.getItem('pendingApplyJobId');
          
          if (pingData.success && pingData.active && savedState.jobId === currentJobId) {
            // Restore active test state
            setSessionId(savedState.sessionId);
            setLoginTimestamp(savedState.loginTimestamp);
            setQuestions(savedState.questions);
            setAnswers(savedState.answers);
            setTimeLeft(savedState.timeLeft);
            setVisited(savedState.visited);
            setCurrentQuestionIndex(savedState.currentQuestionIndex);
            setViolationsTracker(savedState.violationsTracker);
            setIsAgreementAccepted(true);
            setIsActive(true);
            setLoading(false);
            return;
          } else {
            // Invalid/expired session, remove it
            localStorage.removeItem('activeAssessmentState');
          }
        }

        const storedJobId = sessionStorage.getItem('pendingApplyJobId');
        const assessmentParams = new URLSearchParams({ jobId: storedJobId || '' });
        const res = await fetch(`/api/student/assessment?${assessmentParams}`);
        const data = await res.json();
        
        if (data.success) {
          if (data.completed) {
            setIsFinished(true);
            setResult(data.result);
            setStudentName(data.studentName || 'Student');
            if (data.alreadyTakenJob) setAlreadyTakenJob(true);
          } else {
            setQuestions(data.questions || []);
            setStudentName(data.studentName || 'Student');
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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isActive, isFinished]);

  // Multiple Login check: periodically ping server
  useEffect(() => {
    if (!isActive || isFinished || !sessionId) return;

    const pingInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/student/assessment?ping=true&sessionId=${sessionId}`);
        const data = await res.json();
        if (data.success && !data.active) {
          // Terminate active test session
          setSessionBlocked(true);
          setIsActive(false);
          setIsFinished(true);
          localStorage.removeItem('activeAssessmentState');
        }
      } catch (err) {
        console.error('Active session check ping failed:', err);
      }
    }, 10000);

    return () => clearInterval(pingInterval);
  }, [isActive, isFinished, sessionId]);

  // Auto-Save active state to localStorage on any updates
  useEffect(() => {
    if (!isActive || isFinished || !sessionId) return;

    const state = {
      active: true,
      sessionId,
      jobId: pendingJobId,
      loginTimestamp,
      questions,
      answers,
      timeLeft,
      visited,
      currentQuestionIndex,
      violationsTracker
    };
    localStorage.setItem('activeAssessmentState', JSON.stringify(state));
  }, [isActive, isFinished, sessionId, loginTimestamp, questions, answers, timeLeft, visited, currentQuestionIndex, violationsTracker]);

  const startAssessment = async () => {
    const newSessionId = 'sess_' + Math.random().toString(36).substring(2, 14);
    const now = new Date().toISOString();

    setSessionId(newSessionId);
    setLoginTimestamp(now);

    // Call server to store active Session ID
    try {
      const initRes = await fetch(`/api/student/assessment?start=true&sessionId=${newSessionId}`);
      const initData = await initRes.json();
      if (!initData.success) {
        alert(initData.message || 'Failed to initialize security session.');
        return;
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to start proctoring session.');
      return;
    }

    // Shuffle questions and options
    const shuffled = shuffleArray(questions).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));

    setQuestions(shuffled);
    setIsActive(true);
    setVisited({ 0: true });

    // Save initial state to localStorage
    const initialState = {
      active: true,
      sessionId: newSessionId,
      jobId: pendingJobId,
      loginTimestamp: now,
      questions: shuffled,
      answers: {},
      timeLeft: 840,
      visited: { 0: true },
      currentQuestionIndex: 0,
      violationsTracker: {
        tabSwitchCount: 0,
        fullscreenExitCount: 0,
        devtoolsAttemptCount: 0,
        clipboardAttemptCount: 0,
        totalCount: 0,
        integrityScore: 100
      }
    };
    localStorage.setItem('activeAssessmentState', JSON.stringify(initialState));
  };

  const triggerAutoApply = async (jobId) => {
    try {
      const res = await fetch('/api/student/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedSuccessfully(true);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingApplyJobId');
          sessionStorage.removeItem('pendingApplyJobTitle');
          sessionStorage.removeItem('pendingApplyJobCompany');
        }
      } else {
        console.error("Auto apply failed:", data.message);
      }
    } catch (err) {
      console.error("Auto apply error:", err);
    }
  };

  // Submit Handler
  const submitAssessment = async (isAuto, reason = '') => {
    setIsActive(false);
    setIsFinished(true);
    setSubmitting(true);
    localStorage.removeItem('activeAssessmentState');

    try {
      const formattedAnswers = questions.map((q, idx) => {
        const selectedIdx = answers[idx];
        const selectedText = selectedIdx !== undefined && selectedIdx !== -1 ? q.options[selectedIdx] : '';
        return {
          questionText: q.questionText,
          selectedOption: selectedIdx !== undefined ? selectedIdx : -1,
          selectedOptionText: selectedText,
          options: q.options
        };
      });

      const targetJobId = sessionStorage.getItem('pendingApplyJobId');

      const payload = {
        answers: formattedAnswers,
        autoSubmitted: isAuto,
        jobId: targetJobId,
        violations: violationsTracker.totalCount,
        sessionId,
        loginTimestamp,
        browserName: systemSpecs.browserName,
        browserVersion: systemSpecs.browserVersion,
        operatingSystem: systemSpecs.operatingSystem,
        deviceType: systemSpecs.deviceType,
        screenResolution: systemSpecs.screenResolution,
        tabSwitchCount: violationsTracker.tabSwitchCount,
        fullscreenExitCount: violationsTracker.fullscreenExitCount,
        devtoolsAttemptCount: violationsTracker.devtoolsAttemptCount,
        clipboardAttemptCount: violationsTracker.clipboardAttemptCount,
        integrityScore: violationsTracker.integrityScore
      };

      const res = await fetch('/api/student/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(data.result);
        const targetJobId = sessionStorage.getItem('pendingApplyJobId');
        if (targetJobId) {
          await triggerAutoApply(targetJobId);
          router.push('/student/applications');
          return;
        }
      } else {
        setError(data.message || 'Failed to submit proctored assessment.');
      }
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async (reason) => {
    await submitAssessment(true, reason);
  };

  const handleManualSubmit = async () => {
    setShowSubmitModal(false);
    await submitAssessment(false);
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

  const getDurationString = (start, end) => {
    if (!start || !end) return 'N/A';
    const durationMs = new Date(end) - new Date(start);
    const totalSecs = Math.floor(durationMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading proctoring modules...</p>
      </div>
    );
  }

  // Session Blocked layout
  if (sessionBlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center select-none">
        <div className="bg-slate-800 p-8 rounded-[2.5rem] max-w-md w-full border border-slate-700 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
          </div>
          <h2 className="text-2xl font-black mb-3 text-red-400">Session Terminated</h2>
          <p className="text-slate-350 text-sm leading-relaxed mb-6 font-semibold">
            This assessment session has been terminated because the assessment was started on another device or browser.
          </p>
          <button 
            onClick={() => router.push('/student/jobs')}
            className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-4 rounded-xl transition-all shadow-md"
          >
            Back to Job Board
          </button>
        </div>
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
          onClick={() => router.push('/student/jobs')} 
          className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition-all shadow-md"
        >
          Go Back to Job Board
        </button>
      </div>
    );
  }

  // Result screen with full audit trail logs
  if (isFinished && result) {
    const isPass = result.passFail === 'Pass';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] border border-slate-100/60 overflow-hidden relative group">
          
          <div className={`absolute top-0 left-0 w-full h-2.5 ${isPass ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 relative">
            {alreadyTakenJob && (
              <div className="absolute top-0 left-0 right-0 z-50 bg-indigo-50 border-b border-indigo-100 p-3 flex items-center justify-center gap-2 text-indigo-700 rounded-t-[2.5rem]">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="text-xs font-bold">You have already completed the assessment for this job. Displaying your existing result.</span>
              </div>
            )}
            
            {/* Left Column Status Panel */}
            <div className={`lg:col-span-5 p-10 md:p-14 flex flex-col items-center justify-center relative overflow-hidden ${isPass ? 'bg-gradient-to-b from-emerald-50/40 to-white' : 'bg-gradient-to-b from-rose-50/40 to-white'}`}>
              <div className={`absolute w-72 h-72 rounded-full blur-3xl opacity-20 -top-20 -left-20 ${isPass ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl transform transition-transform group-hover:scale-105 duration-500 ${isPass ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-rose-500 shadow-rose-500/40'}`}>
                  {isPass ? (
                    <svg className="w-14 h-14 text-white drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-14 h-14 text-white drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                
                <h1 className={`text-4xl font-black text-center mb-4 tracking-tight ${isPass ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isPass ? 'Passed!' : 'Failed!'}
                </h1>
                
                <p className="text-slate-500 text-center text-sm font-bold leading-relaxed max-w-[280px]">
                  {result.violations >= 3 
                    ? 'Terminated due to multiple proctoring violations.' 
                    : isPass 
                      ? appliedSuccessfully
                        ? 'Assessment Completed! Your application was submitted successfully!'
                        : 'Outstanding performance! You have proven your technical expertise.' 
                      : 'Assessment not cleared. Minimum 70% required.'}
                </p>
                {isPass && appliedSuccessfully && (
                  <div className="mt-5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-black px-5 py-2.5 rounded-xl text-center shadow-inner">
                    ✓ Applied Successfully
                  </div>
                )}
              </div>
            </div>

            {/* Right Column Details & Audit Trail logs */}
            <div className="lg:col-span-7 p-10 md:p-14 lg:pl-16 lg:border-l border-slate-100 flex flex-col justify-center bg-white z-10 relative">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-10 mb-8">
                {/* Circular Progress */}
                <div className="relative flex items-center justify-center shrink-0 select-none">
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
                      <span className="font-bold text-slate-700 text-lg leading-tight">{result.domain}</span>
                    </div>
                    <div className="bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl p-4 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Warnings</span>
                      <span className={`font-bold text-lg ${result.violations > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{result.violations} / 3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 5 Audit Log / Integrity Trail UI */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Security & Audit Log</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 text-xs text-slate-600 font-semibold mb-6">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Candidate Name</span>
                    <span className="text-sm font-black text-slate-800 truncate block">
                      {studentName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Integrity Score</span>
                    <span className={`text-sm font-black ${
                      (result.integrityScore || 100) >= 80 ? 'text-emerald-600' :
                      (result.integrityScore || 100) >= 50 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {result.integrityScore || 100}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Duration Taken</span>
                    <span className="text-sm font-black text-slate-800">
                      {getDurationString(result.loginTimestamp || result.createdAt, result.submissionTimestamp || result.updatedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">OS / Device</span>
                    <span className="text-sm font-black text-slate-800 truncate block">
                      {result.operatingSystem || 'N/A'} ({result.deviceType || 'Desktop'})
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">System Browser Specification</span>
                    <span className="text-sm font-black text-slate-800 truncate block">
                      {result.browserName || 'N/A'} {result.browserVersion || ''} @ {result.screenResolution || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Sub-violations detail list */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px] font-bold text-slate-500">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${result.tabSwitchCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                    <span>Tab Switch: <strong>{result.tabSwitchCount || 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${result.fullscreenExitCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                    <span>Fullscreen: <strong>{result.fullscreenExitCount || 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${result.devtoolsAttemptCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                    <span>DevTools: <strong>{result.devtoolsAttemptCount || 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${result.clipboardAttemptCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                    <span>Clipboard: <strong>{result.clipboardAttemptCount || 0}</strong></span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => router.push('/student')} 
                  className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-black py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l-7-7m-7 7h18" /></svg>
                  Dashboard
                </button>
                <button 
                  onClick={() => router.push('/student/jobs')} 
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-755 hover:to-purple-755 text-white font-black py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 group text-sm"
                >
                  {appliedSuccessfully ? 'Back to Job Board' : 'Find Jobs'}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <ProctoringWrapper 
      isAssessmentActive={isActive} 
      onAutoSubmit={handleAutoSubmit}
      violationsTracker={violationsTracker}
      setViolationsTracker={setViolationsTracker}
    >
      <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
        
        {!isActive ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
            <div className="max-w-3xl w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-200/60 animate-in fade-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto">
              
              {/* Dynamic pending job header */}
              {pendingJobId && pendingJobTitle && (
                <div className="bg-blue-50 border border-blue-150 p-4.5 rounded-2xl text-blue-800 font-medium mb-6 text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.083.87l-.467 1.327a.75.75 0 00.596.992l.04.005A.75.75 0 0112 15a3 3 0 01-3-3 3 3 0 013-3z"></path>
                  </svg>
                  <div>
                    <span className="font-extrabold block text-blue-900 mb-0.5">Assessment Required</span>
                    You are launching this assessment to automatically apply for the <strong className="text-blue-950 font-bold">{pendingJobTitle}</strong> position at <strong className="text-blue-950 font-bold">{pendingJobCompany || 'our partner company'}</strong>. Passing the test is required to submit your application.
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">Proctored Assessment</h1>
                  <p className="text-slate-400 font-semibold text-sm uppercase tracking-wider">Domain Specific Competency Check</p>
                </div>
              </div>

              <div className="prose text-slate-600 space-y-4 mb-6 leading-relaxed">
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
                    <span><strong>Window Switching:</strong> Minimizing the browser or shifting tabs will log warnings. <strong>Exceeding 2 warnings results in auto-failure.</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Key Actions & DevTools:</strong> Right-click, developer console shortcuts (F12, Ctrl+Shift+I), view source, copy/paste/cut are completely blocked.</span>
                  </li>
                </ul>

                <h3 className="font-extrabold text-slate-800 text-lg pt-2 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                  Structure & Guidelines:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-semibold text-center text-sm">
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
                    <p className="text-indigo-600 text-2xl font-black mb-1">20</p>
                    <p className="text-slate-500 text-xs">Total MCQs</p>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
                    <p className="text-indigo-600 text-2xl font-black mb-1">14m</p>
                    <p className="text-slate-500 text-xs">Time Limit</p>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
                    <p className="text-indigo-600 text-2xl font-black mb-1">70%</p>
                    <p className="text-slate-500 text-xs">Passing Grade</p>
                  </div>
                </div>
              </div>


              {/* Rule 9 Agreement accept checkbox */}
              <div ref={bottomRef} className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl mb-8 flex items-start gap-3 select-none">
                <input 
                  type="checkbox" 
                  id="agreement" 
                  checked={isAgreementAccepted} 
                  onChange={(e) => setIsAgreementAccepted(e.target.checked)} 
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 shrink-0 mt-0.5 cursor-pointer"
                />
                <label htmlFor="agreement" className="text-xs font-bold text-slate-650 leading-normal cursor-pointer">
                  I understand that tab switching, fullscreen violations, copy/paste attempts, and other suspicious activities are monitored. Violations may result in automatic submission.
                </label>
              </div>

              <button 
                onClick={startAssessment}
                disabled={!isAgreementAccepted}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-lg transition-all shadow-xl shadow-indigo-600/15 disabled:shadow-none hover:-translate-y-0.5 disabled:hover:translate-y-0 active:translate-y-0"
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
                <h2 className="text-slate-700 font-extrabold text-sm tracking-tight hidden sm:block">Assessment In Progress</h2>
              </div>
              
              <div className="flex items-center gap-6">
                {/* Live Countdown Timer */}
                <div className={`flex items-center gap-2 px-4.5 py-2 rounded-2xl border font-bold ${timeLeft < 180 ? 'bg-red-50 border-red-200 text-red-650 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-705'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="text-lg font-black font-mono">{formatTime(timeLeft)}</span>
                </div>

                <button 
                  onClick={() => setShowSubmitModal(true)} 
                  className="bg-rose-550 text-white hover:bg-rose-650 font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-rose-200/50"
                >
                  Submit Test
                </button>
              </div>
            </header>

            {/* Main Content Workspace Layout */}
            <main className="flex-1 flex overflow-hidden min-h-0 bg-slate-50/50">
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full p-2 md:p-4 gap-4">
                
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

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                      Easy
                    </span>
                  </div>

                  {/* Question Scrollable viewport */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
                    <h2 className="text-slate-800 font-extrabold text-lg md:text-xl leading-snug">
                      {currentQuestion?.questionText}
                    </h2>

                    {/* Radio Options Grid */}
                    <div className="space-y-3 pt-2">
                      {currentQuestion?.options.map((option, i) => {
                        const isSelected = answers[currentQuestionIndex] === i;
                        const optionLabels = ['A', 'B', 'C', 'D'];
                        
                        return (
                          <label 
                            key={i} 
                            onClick={() => handleSelectOption(i)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
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
                            <span className={`font-semibold text-[15px] ${isSelected ? 'text-indigo-900' : 'text-slate-750'}`}>
                                {option}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Navigation Toolbar */}
                  <div className="bg-slate-50 px-4 py-3 md:px-6 md:py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button 
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-650 disabled:opacity-40 disabled:hover:bg-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm"
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
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:translate-y-px text-sm"
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
                        
                        let bubbleClass = 'border-slate-200 hover:border-slate-400 text-slate-650';
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
