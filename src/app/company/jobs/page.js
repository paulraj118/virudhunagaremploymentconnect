'use client';

import { useState, useEffect } from 'react';

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // View Applicants state
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [formData, setFormData] = useState({
    title: '', department: '', role: '', experience: '', salary: '', 
    skills: '', vacancyCount: '', deadline: '', location: '', description: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/company/jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/company/jobs/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          fetchJobs();
        } else {
          alert(data.message || 'Failed to delete job');
        }
      } catch (error) {
        alert('Failed to delete job due to a network error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/company/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchJobs(); // Refresh jobs
        setFormData({ title: '', department: '', role: '', experience: '', salary: '', skills: '', vacancyCount: '', deadline: '', location: '', description: '' });
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Job creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // View Applicants handler
  const handleViewApplicants = async (job) => {
    setSelectedJobForApplicants(job);
    setShowApplicantsModal(true);
    setLoadingApplicants(true);
    setApplicants([]);
    try {
      const res = await fetch(`/api/company/jobs/${job._id}/applicants`);
      const data = await res.json();
      if (data.success) {
        setApplicants(data.applicants);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="text-2xl" title="Rank #1">🥇</span>;
    if (rank === 2) return <span className="text-2xl" title="Rank #2">🥈</span>;
    if (rank === 3) return <span className="text-2xl" title="Rank #3">🥉</span>;
    return <span className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-black">#{rank}</span>;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStageStyle = (stage) => {
    switch (stage) {
      case 'Applied': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Assessment Completed': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Shortlisted': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Interview Scheduled': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Interview Cleared': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Offer Released': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Joined': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Job Postings</h1>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
          + Create New Job
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <div key={job._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
            {!job.isActive && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
            {job.isActive && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{job.title}</h3>
                <p className="text-slate-500 text-sm">{job.department} • {job.location}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${job.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {job.isActive ? 'Active' : 'Closed'}
              </span>
            </div>
            
            <div className="space-y-2 mb-6 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Experience</span>
                <span className="font-medium text-slate-700">{job.experience}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Salary</span>
                <span className="font-medium text-slate-700">{job.salary}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Vacancies</span>
                <span className="font-medium text-slate-700">{job.vacancyCount} Openings</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Deadline</span>
                <span className="font-medium text-red-600">{new Date(job.deadline).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-2 rounded-lg transition-colors text-sm border border-slate-200">
                Edit
              </button>
              <button 
                onClick={() => handleViewApplicants(job)}
                className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 rounded-lg transition-colors text-sm border border-indigo-200"
              >
                View Applicants
              </button>
              <button onClick={() => handleDeleteJob(job._id)} className="w-10 flex flex-shrink-0 items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 transition-colors" title="Delete Job">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
            <p className="text-slate-500 text-lg">No jobs posted yet.</p>
            <button onClick={() => setShowModal(true)} className="text-indigo-600 font-bold mt-2 hover:underline">Create your first job posting</button>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Create New Job Posting</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                  <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                  <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Experience Required</label>
                  <input required type="text" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="e.g. 0-2 Years" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Salary Offer</label>
                  <input required type="text" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="e.g. 8 LPA" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vacancy Count</label>
                  <input required type="number" min="1" value={formData.vacancyCount} onChange={e => setFormData({...formData, vacancyCount: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Application Deadline</label>
                  <input required type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Required Skills (comma separated)</label>
                <input required type="text" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, Node.js, Python" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Description</label>
                <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500"></textarea>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                  {submitting ? 'Posting...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Applicants Modal */}
      {showApplicantsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  Applicants — {selectedJobForApplicants?.title}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedJobForApplicants?.department} • {selectedJobForApplicants?.location} 
                  <span className="ml-3 font-semibold text-indigo-600">{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</span>
                </p>
              </div>
              <button onClick={() => setShowApplicantsModal(false)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto">
              {loadingApplicants ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium">Loading applicants & ranking...</p>
                </div>
              ) : applicants.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                  <p className="text-slate-500 font-medium text-lg">No applicants yet</p>
                  <p className="text-slate-400 text-sm mt-1">Applications will appear here when students apply.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3.5 text-center w-16">Rank</th>
                        <th className="px-4 py-3.5">Student Details</th>
                        <th className="px-4 py-3.5">College & Degree</th>
                        <th className="px-4 py-3.5">Skills</th>
                        <th className="px-4 py-3.5 text-center">Assessment</th>
                        <th className="px-4 py-3.5 text-center">AI Match</th>
                        <th className="px-4 py-3.5">Applied On</th>
                        <th className="px-4 py-3.5 text-center">Status</th>
                        <th className="px-4 py-3.5 text-center">Resume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applicants.map((app) => (
                        <tr key={app._id} className={`hover:bg-slate-50/80 transition-colors ${app.rank <= 3 ? 'bg-indigo-50/30' : ''}`}>
                          {/* Rank */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center">
                              {getRankBadge(app.rank)}
                            </div>
                          </td>

                          {/* Student Details */}
                          <td className="px-4 py-4">
                            <div className="font-bold text-slate-800 text-sm">{app.studentId?.userId?.name || 'N/A'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{app.studentId?.userId?.email || 'N/A'}</div>
                            <div className="text-xs text-indigo-600 font-medium mt-0.5">
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                              {app.studentId?.userId?.mobile || 'N/A'}
                            </div>
                          </td>

                          {/* College & Degree */}
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-700 text-sm">{app.studentId?.collegeName || 'N/A'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{app.studentId?.degree} — {app.studentId?.department}</div>
                          </td>

                          {/* Skills */}
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {app.studentId?.skills?.slice(0, 4).map((skill, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  {skill}
                                </span>
                              ))}
                              {app.studentId?.skills?.length > 4 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
                                  +{app.studentId.skills.length - 4}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Assessment Score */}
                          <td className="px-4 py-4 text-center">
                            {app.assessmentResult ? (
                              <div>
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-sm font-black border ${getScoreColor(app.assessmentResult.percentage)}`}>
                                  {app.assessmentResult.percentage}%
                                </div>
                                <div className="mt-1">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${app.assessmentResult.passFail === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {app.assessmentResult.passFail}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">Not Taken</span>
                            )}
                          </td>

                          {/* AI Match Score */}
                          <td className="px-4 py-4 text-center">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold ${(app.aiResumeScore || 0) >= 70 ? 'bg-emerald-100 text-emerald-700' : (app.aiResumeScore || 0) >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {app.aiResumeScore || 0}%
                            </div>
                          </td>

                          {/* Applied On */}
                          <td className="px-4 py-4">
                            <div className="text-slate-700 font-medium text-sm">
                              {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(app.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border inline-block ${getStageStyle(app.stage)}`}>
                              {app.stage}
                            </span>
                          </td>

                          {/* Resume */}
                          <td className="px-4 py-4 text-center">
                            {app.studentId?.resumeUrl ? (
                              <div className="flex flex-col gap-1.5 items-center">
                                <a 
                                  href={app.studentId.resumeUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                  View
                                </a>
                                <a 
                                  href={app.studentId.resumeUrl} 
                                  download 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                  Download
                                </a>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">No Resume</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
