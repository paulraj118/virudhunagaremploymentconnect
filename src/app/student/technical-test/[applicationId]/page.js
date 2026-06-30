'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function TechnicalTestInstructionsPage() {
  const { applicationId } = useParams();
  const router = useRouter();
  
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchTestDetails();
  }, [applicationId]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      // We can fetch the specific test by filtering the pending list
      const res = await fetch('/api/student/technical-test/pending');
      const data = await res.json();
      
      if (data.success) {
        const test = data.data.tests.find(t => t.applicationId === applicationId);
        if (test) {
          if (['Completed', 'Pass', 'Fail'].includes(test.technicalTestStatus)) {
            router.replace(`/student/technical-test/${applicationId}/result`);
          } else {
            setTestData(test);
          }
        } else {
          setError('Technical Test not found or not assigned to you.');
        }
      } else {
        setError(data.message || 'Failed to fetch test details');
      }
    } catch (err) {
      setError('Server error while fetching test details');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!agreed) return;
    
    setStarting(true);
    // If it's already in progress, just navigate to take
    if (testData.technicalTestStatus === 'In Progress') {
      router.push(`/student/technical-test/${applicationId}/take`);
      return;
    }

    // Otherwise, hit the start API
    try {
      const res = await fetch('/api/student/technical-test/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });
      const data = await res.json();
      
      if (data.success) {
        // Store test data in sessionStorage for the engine to use initially
        sessionStorage.setItem(`tech_test_${applicationId}`, JSON.stringify(data.data));
        router.push(`/student/technical-test/${applicationId}/take`);
      } else {
        setError(data.errors ? data.errors.join(', ') : data.message);
        setStarting(false);
      }
    } catch (err) {
      setError('Failed to start test. Please check your connection.');
      setStarting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-center font-medium">
      {error}
      <button onClick={() => router.push('/student/technical-test')} className="block mx-auto mt-4 underline text-sm text-red-800 hover:text-red-900">Return to Dashboard</button>
    </div>
  );

  if (!testData) return null;

  const { company, jobId, technicalTest, technicalTestStatus } = testData;
  const isResume = technicalTestStatus === 'In Progress';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/student/technical-test" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to My Tests
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">{technicalTest.jobRole} Technical Test</h1>
            <p className="text-slate-300 font-medium text-lg">For {company?.name} — {jobId?.title}</p>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Test Instructions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
              <h3 className="font-bold text-slate-700 text-sm mb-4 uppercase tracking-wider">Test Details</h3>
              <ul className="space-y-3 text-sm text-slate-600 font-medium">
                <li className="flex justify-between border-b border-slate-200 pb-2">
                  <span>Total Marks</span>
                  <span className="font-black text-slate-800">{technicalTest.totalMarks}</span>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-2">
                  <span>Passing Marks</span>
                  <span className="font-black text-emerald-600">{technicalTest.passingMarks}</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span>Duration</span>
                  <span className="font-black text-indigo-600">{technicalTest.duration} Minutes</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
              <h3 className="font-bold text-slate-700 text-sm mb-4 uppercase tracking-wider">Pattern</h3>
              <ul className="space-y-3 text-sm text-slate-600 font-medium">
                <li className="flex justify-between border-b border-slate-200 pb-2">
                  <span>Multiple Choice (MCQ)</span>
                  <span className="font-bold text-slate-800">5 Questions (5 Marks)</span>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-2">
                  <span>Fill in the Blanks</span>
                  <span className="font-bold text-slate-800">5 Questions (5 Marks)</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span>Programming Code</span>
                  <span className="font-bold text-slate-800">2 Questions (10 Marks)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-amber-800 text-sm mb-3 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Important Rules
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-amber-900/80 text-sm font-medium">
              <li><strong>Single Attempt Only:</strong> You cannot retake this test once submitted.</li>
              <li><strong>Do not refresh:</strong> Refreshing or navigating away may cause you to lose unsaved progress.</li>
              <li><strong>Auto Save Enabled:</strong> Your answers are automatically saved as you navigate between questions.</li>
              <li><strong>Auto Submit:</strong> The test will automatically submit when the timer reaches zero.</li>
              <li><strong>Programming:</strong> Use the provided code editor. Code is evaluated against hidden test cases.</li>
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-6 h-6 peer appearance-none rounded-lg border-2 border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-colors"
                />
                <svg className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">I Agree</p>
                <p className="text-slate-500 text-sm">I have read and understood all the instructions and rules. I am ready to begin.</p>
              </div>
            </label>
          </div>

          <button
            onClick={handleStart}
            disabled={!agreed || starting}
            className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5"
          >
            {starting ? (
              <><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Loading Engine...</>
            ) : (
              isResume ? 'Resume Test' : 'Start Test'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
