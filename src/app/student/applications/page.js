'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentApplications() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
    fetchAssessmentResults();
  }, []);

  async function fetchApplications() {
    try {
      const res = await fetch('/api/student/applications');
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
        setAssessmentScore(data.assessmentScore || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch assessment results to match with applications (read-only, no backend changes)
  async function fetchAssessmentResults() {
    try {
      const res = await fetch('/api/student/assessment?jobId=null');
      const data = await res.json();
      if (data.success && data.completed && data.result) {
        // Single result from self-assessment
        setAssessmentResults(prev => [...prev, data.result]);
      }
    } catch (error) {
      // Silently fail — report button just won't show
      console.error('Fetch assessment results:', error);
    }
  };

  // Find assessment result for a given application
  const getAssessmentResultId = (app) => {
    // Try matching by jobId in assessment results
    const match = assessmentResults.find(r => r.jobId && r.jobId.toString() === app.jobId?._id?.toString());
    if (match) return match._id;
    // For applications with completed stages, use the general assessment result
    if (app.stage !== 'Applied') {
      const general = assessmentResults.find(r => !r.jobId || r.jobId === null);
      if (general) return general._id;
    }
    return null;
  };

  // Check if assessment is completed for this application
  const isAssessmentCompleted = (app) => {
    return app.stage !== 'Applied';
  };

  const getStatusStyle = (stage) => {
    switch (stage) {
      case 'Applied':
        return 'text-blue-600';
      case 'Assessment Completed':
        return 'text-cyan-600';
      case 'Shortlisted':
        return 'text-purple-600';
      case 'Interview Scheduled':
        return 'text-amber-600';
      case 'Interview Cleared':
        return 'text-teal-600';
      case 'Offer Released':
        return 'text-indigo-600';
      case 'Joined':
        return 'text-emerald-600';
      case 'Rejected':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading applications...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            My Applications
          </h1>
          <p className="text-slate-500 mt-1">Track all jobs you have applied for.</p>
        </div>
        {assessmentScore > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Assessment Score</span>
            <p className={`text-xl font-black ${assessmentScore >= 70 ? 'text-emerald-600' : assessmentScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {assessmentScore}%
            </p>
          </div>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          </div>
          <p className="text-slate-500 font-medium">You haven't applied to any jobs yet.</p>
          <p className="text-slate-400 text-sm mt-1">Browse the Job Board to find opportunities.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">HR Name</th>
                  <th className="px-6 py-4">Applied On</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assessment Score</th>
                  <th className="px-6 py-4">Match Score</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(app => (
                  <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{app.jobId?.title || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{app.jobId?.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-indigo-600">{app.companyId?.companyName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{app.companyId?.hrName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 font-medium">
                        {new Date(app.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(app.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${getStatusStyle(app.stage)}`}>
                        {app.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-lg font-black ${assessmentScore >= 70 ? 'text-emerald-600' : assessmentScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {assessmentScore}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${app.aiResumeScore >= 70 ? 'bg-emerald-100 text-emerald-700' : app.aiResumeScore >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {app.aiResumeScore || 0}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isAssessmentCompleted(app) ? (
                        <button
                          onClick={() => {
                            const resultId = getAssessmentResultId(app);
                            if (resultId) {
                              router.push(`/student/applications/report/${resultId}`);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          View Report
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
