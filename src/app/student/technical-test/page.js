'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentTechnicalTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/technical-test/pending');
      const data = await res.json();
      if (data.success) {
        setTests(data.data?.tests || []);
      } else {
        setError(data.message || 'Failed to fetch tests');
      }
    } catch (err) {
      setError('Server error while fetching tests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = status || 'Not Assigned';
    if (s === 'Assigned') return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider">Not Started</span>;
    if (s === 'In Progress') return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold uppercase tracking-wider">In Progress</span>;
    if (s === 'Completed') return <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-wider">Submitted</span>;
    if (s === 'Pass') return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">Passed</span>;
    if (s === 'Fail') return <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider">Failed</span>;
    return <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-wider">{s}</span>;
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">My Technical Tests</h1>
        <p className="text-slate-500 font-medium mt-1">Complete your assigned technical assessments to move forward in the hiring process.</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 font-medium">
          {error}
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Tests Assigned</h2>
          <p className="text-slate-500">You currently don't have any pending technical tests. When an HR assigns one to you, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tests.map((item) => {
            const { applicationId, company, jobId, technicalTest, technicalTestStatus, attempt } = item;
            if (!technicalTest) return null; // Defensive check

            const isLocked = ['Completed', 'Pass', 'Fail'].includes(technicalTestStatus);
            const isInProgress = technicalTestStatus === 'In Progress';
            const actionText = isLocked ? 'View Result' : isInProgress ? 'Resume Test' : 'Start Test';
            const targetUrl = isLocked ? `/student/technical-test/${applicationId}/result` : `/student/technical-test/${applicationId}`;
            
            return (
              <div key={applicationId} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex-1">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      {company?.logo ? (
                        <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                          {company?.name?.charAt(0) || 'C'}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{company?.name || 'Unknown Company'}</p>
                        <h3 className="font-bold text-slate-800 leading-tight mt-0.5">{jobId?.title || 'Unknown Job'}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-5">
                    <h4 className="text-lg font-black text-indigo-700">{technicalTest.jobRole} Technical Test</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-slate-400 text-xs font-medium mb-1">Duration</p>
                      <p className="font-bold text-slate-700 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {technicalTest.duration} mins
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-medium mb-1">Pass Mark</p>
                      <p className="font-bold text-slate-700">
                        {technicalTest.passingMarks} <span className="text-slate-400 font-normal">/ {technicalTest.totalMarks}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-slate-400 text-xs font-medium mb-1">Status</p>
                      {getStatusBadge(technicalTestStatus)}
                    </div>
                    {attempt && attempt.scores && (
                      <div className="text-right">
                        <p className="text-slate-400 text-xs font-medium mb-1">Your Score</p>
                        <p className="font-black text-indigo-700 text-lg">{attempt.scores.totalScore}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                  <button 
                    onClick={() => router.push(targetUrl)}
                    className={`flex-1 font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm ${
                      isLocked 
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {actionText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
