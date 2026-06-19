'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState(null);
  const [gated, setGated] = useState(false);
  const [gateMessage, setGateMessage] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/student/jobs');
      const data = await res.json();
      if (data.success) {
        if (data.gated) {
          setGated(true);
          setGateMessage(data.message || 'You must pass the assessment test to access job opportunities.');
        } else {
          setJobs(data.jobs);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    setApplyingTo(jobId);
    try {
      const res = await fetch('/api/student/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Successfully Applied! AI Resume Screening completed.');
        fetchJobs(); // Re-fetch to maybe update state (though we didn't add an applied boolean to the response yet, we can just alert for now)
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Application failed');
    } finally {
      setApplyingTo(null);
    }
  };

  if (loading) return <div>Loading AI recommended jobs...</div>;

  // Assessment gate: show blocking message if student hasn't passed
  if (gated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg border border-slate-200 p-10 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3">Assessment Required</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">{gateMessage}</p>
          <Link
            href="/student/assessments"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Take Assessment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            AI Recommended Jobs
          </h1>
          <p className="text-slate-500 mt-1">Jobs sorted by your Resume Match Score.</p>
        </div>
      </div>

      <div className="space-y-6">
        {jobs.map(job => (
          <div key={job._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden">
            {/* Match Score Badge */}
            <div className="absolute top-0 right-0 bg-indigo-600 text-white font-bold text-sm px-4 py-1.5 rounded-bl-2xl shadow-sm">
              {job.aiMatchScore}% Match
            </div>

            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-2xl text-slate-400 shrink-0 mt-2">
              {job.companyId?.companyName?.charAt(0)}
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-xl text-slate-800">{job.title}</h3>
              <p className="text-indigo-600 font-medium mb-3">{job.companyId?.companyName} <span className="text-slate-400 font-normal ml-2">• {job.location}</span></p>
              
              <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">{job.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills.map((skill, i) => {
                  const isMissing = job.aiMissingSkills?.includes(skill.toLowerCase());
                  return (
                    <span key={i} className={`px-2.5 py-1 rounded-md text-xs font-medium border ${isMissing ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {skill} {isMissing && ' (Missing)'}
                    </span>
                  );
                })}
              </div>

              {job.aiMissingSkills?.length > 0 && (
                <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg mb-4 inline-block font-medium">
                  <strong>AI Skill Gap Analysis:</strong> You are missing {job.aiMissingSkills.length} required skills for this role.
                </div>
              )}

              <div className="flex gap-4 items-center">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {job.salary}
                </span>
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  {job.experience}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <button 
                onClick={() => handleApply(job._id)}
                disabled={applyingTo === job._id}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md shrink-0 w-full md:w-auto"
              >
                {applyingTo === job._id ? 'Applying...' : 'Apply Now'}
              </button>
            </div>
          </div>
        ))}
        
        {jobs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <p className="text-slate-500 font-medium">No jobs available right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}

