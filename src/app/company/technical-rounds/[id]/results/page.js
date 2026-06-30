'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function TechnicalTestResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchResults();
  }, [id, filter]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const filterQuery = filter ? `?result=${filter}` : '';
      const res = await fetch(`/api/company/technical-tests/${id}/results${filterQuery}`);
      const json = await res.json();
      
      if (json.success) {
        // Sort by score DESC, then time taken ASC
        const sortedAttempts = json.data.attempts.sort((a, b) => {
          if (b.scores.totalScore !== a.scores.totalScore) {
            return b.scores.totalScore - a.scores.totalScore;
          }
          return (a.timeTaken || 0) - (b.timeTaken || 0);
        });
        
        setData({ ...json.data, attempts: sortedAttempts });
      } else {
        setError(json.message || 'Failed to fetch results');
      }
    } catch (err) {
      setError('Server error while fetching results');
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
    <div className="bg-red-50 text-red-600 p-8 rounded-2xl text-center max-w-2xl mx-auto mt-10 font-medium">
      {error || 'Results not found'}
      <button onClick={() => router.push(`/company/technical-rounds/${id}`)} className="block mt-4 text-sm text-red-800 underline mx-auto">Back to Test Details</button>
    </div>
  );

  const { test, summary, attempts } = data;

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/company/technical-rounds/${id}`)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Test Results</h1>
            <p className="text-slate-500 text-sm font-medium">For {test.jobRole} (Pass Mark: {test.passingMarks}/{test.totalMarks})</p>
          </div>
        </div>
        
        <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200">
          <button 
            onClick={() => setFilter('')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === '' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('Pass')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === 'Pass' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Passed
          </button>
          <button 
            onClick={() => setFilter('Fail')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === 'Fail' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Attempts</p>
          <p className="text-2xl font-black text-slate-800">{summary.totalAttempts}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Passed Candidates</p>
          <p className="text-2xl font-black text-emerald-700">{summary.passed}</p>
          {summary.totalAttempts > 0 && <p className="text-xs font-medium text-emerald-600 mt-1">{Math.round((summary.passed / summary.totalAttempts) * 100)}% Pass Rate</p>}
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-1">Failed Candidates</p>
          <p className="text-2xl font-black text-red-700">{summary.failed}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Average Score</p>
          <p className="text-2xl font-black text-indigo-700">{summary.averageScore} <span className="text-sm font-medium">/ 20</span></p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {attempts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p className="text-slate-600 font-medium text-lg">No results found.</p>
            <p className="text-slate-400 text-sm mt-1">Candidates have not yet completed this test, or no one matches the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-4 px-4 text-center">Rank</th>
                  <th className="py-4 px-4">Candidate</th>
                  <th className="py-4 px-4 text-center">Score / %</th>
                  <th className="py-4 px-4 text-center">Prog (10)</th>
                  <th className="py-4 px-4 text-center">Time</th>
                  <th className="py-4 px-4 text-center">Security</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((attempt, index) => {
                  const student = attempt.candidateId || {};
                  const scores = attempt.scores || {};
                  const programmingScore = (scores.programming1Score || 0) + (scores.programming2Score || 0);
                  const percentage = ((scores.totalScore || 0) / 20) * 100;
                  
                  return (
                    <tr key={attempt._id} className={`hover:bg-slate-50 transition-colors ${attempt.warningCount >= 4 ? 'bg-red-50/30' : ''}`}>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-amber-700/20 text-amber-800' : 'text-slate-400'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800">{student.name || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-500">{student.email || 'No email'}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="font-black text-indigo-700 text-lg">{scores.totalScore || 0} <span className="text-[10px] text-slate-400 font-medium">/ 20</span></div>
                        <div className="text-[10px] font-bold text-slate-500">{percentage}%</div>
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-slate-700">
                        {programmingScore}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-medium text-slate-600">
                          {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
                        </span>
                        {attempt.autoSubmitted && (
                          <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mt-1">{attempt.submissionReason || 'Auto-submitted'}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {attempt.warningCount > 0 ? (
                          <div className={`text-[11px] font-bold px-2 py-1 rounded-md inline-block ${attempt.warningCount >= 4 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {attempt.warningCount} Warnings
                            <span className="block text-[9px] opacity-80">{attempt.cheatingLogs?.length || 0} Events</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Clean</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {attempt.resultStatus === 'Pass' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">Pass</span>
                        ) : attempt.resultStatus === 'Fail' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-700">Fail</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Pending</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <button className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                            Audit Logs
                          </button>
                          {attempt.resultStatus === 'Pass' && (
                            <Link href={`/company/interviews/schedule?candidateId=${student._id}&jobId=${attempt.jobId}`} className="text-white hover:bg-emerald-700 text-[11px] font-bold bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm">
                              Schedule Interview
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
