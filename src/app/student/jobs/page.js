'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState(null);
  const [gated, setGated] = useState(false);
  const [gateMessage, setGateMessage] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [localAppliedJobs, setLocalAppliedJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, logout } = useAuth();

  useEffect(() => {
    // Read local applied jobs from storage
    const applied = JSON.parse(localStorage.getItem('localAppliedJobs') || '[]');
    const startedJobId = sessionStorage.getItem('startedAssessmentJobId');
    const pendingJobId = sessionStorage.getItem('pendingApplyJobId');
    
    let updatedApplied = [...applied];
    
    // If startedJobId exists but pendingJobId is gone, it means the assessment was successfully completed
    // and triggerAutoApply cleared the pending state. OR even if it failed, we want to mark it as applied
    // so it doesn't stay as 'Apply Now'.
    // Actually, to just mark it applied if they finish it (pass or fail):
    // Wait, the prompt says "After successfully completing the assessment: ONLY that specific job card's button must automatically change".
    // If they just finish, we can mark it.
    if (startedJobId && !pendingJobId) {
      if (!updatedApplied.includes(startedJobId)) {
        updatedApplied.push(startedJobId);
        localStorage.setItem('localAppliedJobs', JSON.stringify(updatedApplied));
      }
      sessionStorage.removeItem('startedAssessmentJobId');
    } else if (startedJobId && pendingJobId) {
      // They didn't finish or failed and it didn't auto-apply. But wait!
      // "one time one card apply now kututhu assessment attend pannita ennaku antha card laa already appilied nuu varanum"
      // If we want it to be applied regardless of pass/fail, we should mark it anyway if they returned!
      if (!updatedApplied.includes(startedJobId)) {
        updatedApplied.push(startedJobId);
        localStorage.setItem('localAppliedJobs', JSON.stringify(updatedApplied));
      }
      sessionStorage.removeItem('startedAssessmentJobId');
      sessionStorage.removeItem('pendingApplyJobId');
    }

    setLocalAppliedJobs(updatedApplied);
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
        fetchJobs();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Application failed');
    } finally {
      setApplyingTo(null);
    }
  };

  const handleApplyClick = (job) => {
    if (job.hasApplied) {
      return; // Already applied
    }

    // Always redirect to the assessments page to take the per-job test
    sessionStorage.setItem('pendingApplyJobId', job._id);
    sessionStorage.setItem('pendingApplyJobTitle', job.title);
    sessionStorage.setItem('pendingApplyJobCompany', job.companyId?.companyName || '');
    sessionStorage.setItem('startedAssessmentJobId', job._id); // Track what we started
    
    window.location.href = '/student/assessments';


  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium animate-pulse">Loading AI recommended jobs...</p>
    </div>
  );

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

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.companyId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto pb-16">
      
      {/* Page Title & Subheading */}
      <div className="mb-8 pl-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Job Alerts for You</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-semibold">Explore opportunities matching your profile track</p>
        </div>
        
        {/* Search Bar */}
        <div className="w-full md:w-80 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search jobs, skills, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* 3-Column Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map(job => (
          <div 
            key={job._id} 
            className="bg-white rounded-3xl border-2 border-blue-500/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 relative overflow-hidden flex flex-col h-full min-h-[380px] group hover:shadow-md hover:border-blue-650 transition-all duration-300"
          >
            {/* Match Score Badge on top-right */}
            {job.aiMatchScore && (
              <div className="absolute top-3 right-3 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
                {job.aiMatchScore}% Match
              </div>
            )}

            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Title */}
                <h3 className="font-extrabold text-[1.25rem] text-slate-800 leading-snug pr-12 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>

                {/* Company Name */}
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-3">
                  <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-bold text-slate-655">{job.companyId?.companyName}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-slate-550 text-xs mt-1.5">
                  <svg className="w-4.5 h-4.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold text-slate-600">{job.location}</span>
                </div>

                {/* Required Skills Title */}
                <h4 className="text-slate-800 font-extrabold text-sm mt-5 mb-1.5">Required Skills</h4>

                {/* Description and Skills Capsule Box */}
                <div className="bg-slate-50/70 border border-slate-100/80 p-4 rounded-xl text-slate-650 text-xs leading-relaxed flex flex-col justify-between min-h-[110px]">
                  <p className="line-clamp-3 text-slate-500 font-medium">
                    {job.description || 'No description available for this position.'}
                  </p>
                  
                  {/* Skills Tag Pills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-slate-100/50">
                      {job.skills.slice(0, 3).map((skill, i) => {
                        const isMissing = job.aiMissingSkills?.includes(skill.toLowerCase());
                        return (
                          <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isMissing ? 'bg-red-50 text-red-650 border-red-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                            {skill}
                          </span>
                        );
                      })}
                      {job.skills.length > 3 && (
                        <span className="bg-blue-50 border border-blue-150 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded">
                          +{job.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions aligned properly at the bottom */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button 
                  onClick={() => setSelectedJob(job)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-black flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View Details
                </button>

                <button 
                  onClick={() => handleApplyClick(job)}
                  disabled={applyingTo === job._id || job.hasApplied || localAppliedJobs.includes(job._id)}
                  className={`font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm active:translate-y-px shrink-0 ${
                    job.hasApplied || localAppliedJobs.includes(job._id)
                      ? 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white'
                  }`}
                >
                  {applyingTo === job._id 
                    ? 'Applying...' 
                    : (job.hasApplied || localAppliedJobs.includes(job._id))
                      ? 'Already Applied' 
                      : 'Apply Now'
                  }
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredJobs.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-150/70 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <p className="text-slate-500 font-medium">No jobs available right now.</p>
        </div>
      )}

      {/* View Job Details Modal popup */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-350 border border-slate-100">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedJob.aiMatchScore ? `${selectedJob.aiMatchScore}% Match` : 'Recommended'}
                </span>
                <h3 className="text-2xl font-black text-slate-800 mt-2">{selectedJob.title}</h3>
                <p className="text-indigo-650 font-bold mt-1">{selectedJob.companyId?.companyName}</p>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-650 transition-colors p-2 rounded-full hover:bg-slate-150"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Job Description</h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salary / Package</span>
                  <span className="text-slate-800 font-extrabold text-sm">{selectedJob.salary}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Experience Required</span>
                  <span className="text-slate-800 font-extrabold text-sm">{selectedJob.experience}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Location</span>
                  <span className="text-slate-800 font-extrabold text-sm">{selectedJob.location}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vacancies</span>
                  <span className="text-slate-800 font-extrabold text-sm">{selectedJob.vacancies || 'Not specified'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Skills Requirements</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map((skill, i) => {
                    const isMissing = selectedJob.aiMissingSkills?.includes(skill.toLowerCase());
                    return (
                      <span key={i} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${isMissing ? 'bg-red-50 text-red-655 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {skill} {isMissing && ' (Missing)'}
                      </span>
                    );
                  })}
                </div>
              </div>

              {selectedJob.aiMissingSkills?.length > 0 && (
                <div className="bg-red-50 border border-red-100 text-red-750 p-4 rounded-2xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <div>
                    <h5 className="font-extrabold text-sm text-red-800">Skill Recommendation</h5>
                    <p className="text-xs font-medium text-red-700 mt-1 leading-normal">
                      You are missing {selectedJob.aiMissingSkills.length} required skill(s) for this position: {selectedJob.aiMissingSkills.join(', ')}. Updating your resume or adding these skills to your profile might boost your compatibility!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold rounded-xl text-sm transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  handleApplyClick(selectedJob);
                  setSelectedJob(null);
                }}
                disabled={applyingTo === selectedJob._id || selectedJob.hasApplied || localAppliedJobs.includes(selectedJob._id)}
                className={`font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-md disabled:opacity-50 ${
                  selectedJob.hasApplied || localAppliedJobs.includes(selectedJob._id)
                    ? 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-750 text-white'
                }`}
              >
                {applyingTo === selectedJob._id 
                  ? 'Applying...' 
                  : (selectedJob.hasApplied || localAppliedJobs.includes(selectedJob._id))
                    ? 'Already Applied' 
                    : 'Apply Now'
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
