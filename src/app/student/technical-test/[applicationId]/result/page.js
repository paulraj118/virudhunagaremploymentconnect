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
      // Fetch from the pending endpoint which also returns completed tests
      const res = await fetch('/api/student/technical-test/pending');
      const json = await res.json();
      
      if (json.success) {
        const testItem = json.data.tests.find(t => t.applicationId === applicationId);
        if (testItem) {
          if (!['Completed', 'Pass', 'Fail'].includes(testItem.technicalTestStatus)) {
            router.replace(`/student/technical-test`);
          } else {
            setData(testItem);
          }
        } else {
          setError('Test not found.');
        }
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError('Server error while fetching results.');
    } finally {
      setLoading(false);
    }
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

  const { company, jobId, technicalTest, technicalTestStatus, attempt } = data;
  const { scores, resultStatus, autoSubmitted, timeTaken } = attempt || {};

  const isPass = resultStatus === 'Pass';
  const percentage = scores ? Math.round((scores.totalScore / technicalTest.totalMarks) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      <div className="mb-6">
        <Link href="/student/technical-test" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-center p-10">
        
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {isPass ? (
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          ) : (
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-black text-slate-800 mb-2">
          {isPass ? 'Congratulations! You Passed' : 'Test Completed'}
        </h1>
        <p className="text-slate-500 font-medium mb-8">
          {technicalTest.jobRole} Technical Test for <span className="font-bold text-slate-700">{company?.name}</span>
        </p>

        {/* Score Breakdown */}
        {scores ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 mb-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-6">
              <div className="text-left">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Total Score</p>
                <p className={`text-4xl font-black ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>
                  {scores.totalScore} <span className="text-2xl text-slate-400 font-bold">/ {technicalTest.totalMarks}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Percentage</p>
                <p className={`text-4xl font-black ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>{percentage}%</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                <span>Multiple Choice (MCQ)</span>
                <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">{scores.mcqScore} / 5</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                <span>Fill in the Blanks</span>
                <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">{scores.fillBlanksScore} / 5</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                <span>Programming Part 1</span>
                <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">{scores.programming1Score} / 5</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                <span>Programming Part 2</span>
                <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">{scores.programming2Score} / 5</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 mb-8 max-w-2xl mx-auto">
            <p className="text-slate-500 font-medium">Evaluation in progress...</p>
          </div>
        )}

        {/* Post-Test Message */}
        {isPass ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 className="font-bold text-emerald-800 flex items-center justify-center gap-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Waiting for HR Interview Schedule
            </h3>
            <p className="text-emerald-700/80 text-sm font-medium">
              You have successfully passed the technical round. The HR will review your application and schedule an interview. 
              Once scheduled, it will appear in your <Link href="/student/interviews" className="underline font-bold">My Interviews</Link> section.
            </p>
          </div>
        ) : resultStatus === 'Fail' ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-2xl mx-auto text-slate-600 text-sm font-medium">
            Unfortunately, you did not meet the passing criteria ({technicalTest.passingMarks} marks) for this technical round. We wish you the best in your future applications.
          </div>
        ) : null}

      </div>
    </div>
  );
}
