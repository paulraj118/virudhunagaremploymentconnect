'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function CandidateResultPage() {
  const { applicationId } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [applicationId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/technical-test/${applicationId}/result`, { cache: 'no-store' });
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        if (res.status === 403) {
          router.replace(`/student/technical-test`);
        } else {
          setError(json.message);
        }
      }
    } catch (err) {
      setError('Server error while fetching results.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !data) return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-center font-medium">
      {error}
      <button onClick={() => router.push('/student/technical-test')} className="block mx-auto mt-4 underline text-sm text-red-800 hover:text-red-900">Return to Dashboard</button>
    </div>
  );

  const { company, technicalTest, attempt, analysis } = data;
  const { scores, resultStatus, timeTaken, answers } = attempt || {};

  const isPass = resultStatus === 'Pass';
  const percentage = scores ? Math.round((scores.totalScore / technicalTest.totalMarks) * 100) : 0;
  
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-20 print:p-0 print:max-w-full">
      {/* Print Hide Actions */}
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Link href="/student/technical-test" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>
        <button onClick={handleDownload} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Download PDF Report
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        
        {/* Report Header */}
        <div className="p-10 text-center border-b border-slate-100 bg-slate-50 print:bg-white print:p-4">
          <div className="flex justify-center mb-6 print:hidden">
            {isPass ? (
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center shadow-inner">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-2 print:text-2xl">Candidate Test Report</h1>
          <p className="text-slate-500 font-medium mb-6 print:mb-2">
            {technicalTest.jobRole} • <span className="font-bold text-slate-700">{company?.name}</span>
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 print:border-slate-300">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Score</p>
              <p className="text-xl font-black text-slate-800">{scores?.totalScore} <span className="text-sm text-slate-400 font-bold">/ {technicalTest.totalMarks}</span></p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 print:border-slate-300">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Percentage</p>
              <p className={`text-xl font-black ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>{percentage}%</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 print:border-slate-300">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time Taken</p>
              <p className="text-xl font-black text-slate-800">{formatTime(timeTaken)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 print:border-slate-300">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Final Result</p>
              <p className={`text-xl font-black ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>{resultStatus}</p>
            </div>
          </div>
        </div>

        {/* Post-Test Message (Hide on Print) */}
        <div className="p-8 pb-0 print:hidden">
          {isPass ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Waiting for HR Interview
              </h3>
              <p className="text-emerald-700/80 text-sm font-medium">
                You have successfully passed the technical round. HR will review your application and schedule an interview. 
              </p>
            </div>
          ) : resultStatus === 'Fail' ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm font-medium">
              Unfortunately, you did not meet the passing criteria ({technicalTest.passingMarks} marks) for this technical round.
            </div>
          ) : null}
        </div>

        {/* Performance Analysis */}
        <div className="p-8 print:p-4">
          <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Performance Analysis
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Strong Areas
              </h3>
              {analysis?.strongAreas?.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.strongAreas.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-bold text-slate-700">
                      <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                      {area}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium text-slate-400">No specific strong areas identified.</p>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> Areas for Improvement
              </h3>
              {analysis?.weakAreas?.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.weakAreas.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-bold text-slate-700">
                      <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      {area}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium text-slate-400">No major weak areas identified.</p>
              )}
            </div>
          </div>

          <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-3">Recommendations</h3>
            <ul className="space-y-2 list-disc list-inside text-sm font-medium text-indigo-900/80">
              {analysis?.recommendations?.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Review Section */}
        <div className="p-8 border-t border-slate-100 print:p-4 print:mt-4">
          <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 112-2h2a2 2 0 012 2"></path></svg>
            Review Answers
          </h2>

          <div className="space-y-8">
            {/* MCQ Answers */}
            {technicalTest?.sections?.sectionA_MCQ?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Multiple Choice Questions</h3>
                <div className="space-y-4">
                  {technicalTest.sections.sectionA_MCQ.map((q, i) => {
                    const studentAns = answers?.mcq?.[i];
                    const correctAns = String(q.correctOption).toUpperCase();
                    const isCorrect = String(studentAns).toUpperCase() === correctAns;
                    
                    return (
                      <div key={i} className={`p-5 rounded-2xl border-2 ${isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                        <p className="text-slate-800 font-bold mb-4"><span className="text-slate-400 mr-2">Q{i+1}.</span> {q.question}</p>
                        
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Your Answer</p>
                            <div className={`flex items-start gap-2 text-sm font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                              {studentAns ? (
                                <>
                                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs text-white ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                    {['A','B','C','D'].includes(String(studentAns).toUpperCase()) ? studentAns : (isCorrect ? '✓' : '✗')}
                                  </div>
                                  <span className="mt-0.5">
                                    {['A','B','C','D'].includes(String(studentAns).toUpperCase()) 
                                      ? (q.options[['A','B','C','D'].indexOf(String(studentAns).toUpperCase())] || studentAns) 
                                      : studentAns}
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-400 mt-0.5">Not Answered</span>
                              )}
                            </div>
                          </div>
                          
                          {!isCorrect && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Correct Answer</p>
                              <div className="flex items-start gap-2 text-sm font-bold text-emerald-700">
                                <div className="w-6 h-6 rounded-full shrink-0 bg-emerald-500 flex items-center justify-center text-xs text-white">
                                  {['A','B','C','D'].includes(correctAns) ? correctAns : '✓'}
                                </div>
                                <span className="mt-0.5">
                                  {['A','B','C','D'].includes(correctAns) 
                                    ? q.options[['A','B','C','D'].indexOf(correctAns)] 
                                    : q.correctOption}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fill in the blanks */}
            {technicalTest?.sections?.sectionB_FillBlanks?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Fill in the Blanks</h3>
                <div className="space-y-4">
                  {technicalTest.sections.sectionB_FillBlanks.map((q, i) => {
                    const studentAns = answers?.fillBlanks?.[i] || '';
                    const correctAns = String(q.correctAnswer).trim();
                    const isCorrect = String(studentAns).trim().toLowerCase() === correctAns.toLowerCase();
                    
                    return (
                      <div key={i} className={`p-5 rounded-2xl border-2 ${isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                        <p className="text-slate-800 font-bold mb-4"><span className="text-slate-400 mr-2">Q{i+1}.</span> {q.question}</p>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Answer</p>
                            <p className={`text-sm font-bold px-3 py-2 rounded-lg border inline-block ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                              {studentAns || <span className="text-red-400 font-normal italic">Not Answered</span>}
                            </p>
                          </div>
                          
                          {!isCorrect && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correct Answer</p>
                              <p className="text-sm font-bold px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-800 inline-block">
                                {correctAns}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Programming section */}
            {(technicalTest?.sections?.sectionC_Programming1 || technicalTest?.sections?.sectionD_Programming2) && (
              <div className="print:break-before-page">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 mt-8">Programming Submissions</h3>
                <div className="space-y-6">
                  {technicalTest.sections.sectionC_Programming1 && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <div className="bg-slate-50 p-4 border-b border-slate-200">
                        <p className="font-bold text-slate-800 text-sm">Part 1: {technicalTest.sections.sectionC_Programming1.title}</p>
                      </div>
                      <div className="p-4 border-b border-slate-200">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Your Submitted Code</p>
                         <div className="p-4 bg-slate-900 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                           {answers?.programming1?.code || '// No code submitted'}
                         </div>
                      </div>
                      
                      {technicalTest.sections.sectionC_Programming1.hiddenTestCases?.length > 0 && (
                        <div className="p-4 bg-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Evaluation Criteria (Expected Outputs)</p>
                          <div className="space-y-3">
                            {technicalTest.sections.sectionC_Programming1.hiddenTestCases.map((tc, idx) => (
                              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                  <span className="font-bold text-slate-500 block mb-1">Test Case {idx + 1} Input:</span>
                                  <code className="bg-slate-100 px-2 py-1 rounded block whitespace-pre-wrap">{tc.input}</code>
                                </div>
                                <div className="flex-1">
                                  <span className="font-bold text-slate-500 block mb-1">Expected Output:</span>
                                  <code className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 block whitespace-pre-wrap">{tc.expectedOutput}</code>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {technicalTest.sections.sectionD_Programming2 && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden mt-6">
                      <div className="bg-slate-50 p-4 border-b border-slate-200">
                        <p className="font-bold text-slate-800 text-sm">Part 2: {technicalTest.sections.sectionD_Programming2.title}</p>
                      </div>
                      <div className="p-4 border-b border-slate-200">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Your Submitted Code</p>
                         <div className="p-4 bg-slate-900 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                           {answers?.programming2?.code || '// No code submitted'}
                         </div>
                      </div>

                      {technicalTest.sections.sectionD_Programming2.hiddenTestCases?.length > 0 && (
                        <div className="p-4 bg-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Evaluation Criteria (Expected Outputs)</p>
                          <div className="space-y-3">
                            {technicalTest.sections.sectionD_Programming2.hiddenTestCases.map((tc, idx) => (
                              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                  <span className="font-bold text-slate-500 block mb-1">Test Case {idx + 1} Input:</span>
                                  <code className="bg-slate-100 px-2 py-1 rounded block whitespace-pre-wrap">{tc.input}</code>
                                </div>
                                <div className="flex-1">
                                  <span className="font-bold text-slate-500 block mb-1">Expected Output:</span>
                                  <code className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 block whitespace-pre-wrap">{tc.expectedOutput}</code>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
