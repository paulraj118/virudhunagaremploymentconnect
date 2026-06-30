'use client';

import { useState, useEffect } from 'react';

export default function PlacementTracking() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Filtering state
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('All Jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  // Interview Modal state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState({ date: '', link: '' });

  const STAGES = [
    'Applied', 'Assessment Completed', 'Shortlisted', 'Interview Scheduled', 
    'Interview Cleared', 'Offer Released', 'Joined', 'Rejected'
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [selectedRole]);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/company/jobs');
      const data = await res.json();
      if (data.success) {
        const uniqueRoles = [...new Set(data.jobs.map(job => job.title))].filter(Boolean);
        setJobRoles(uniqueRoles);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const url = selectedRole === 'All Jobs' 
        ? '/api/company/applications' 
        : `/api/company/applications?role=${encodeURIComponent(selectedRole)}`;
        
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (id, stage, additionalData = {}) => {
    try {
      const res = await fetch(`/api/company/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, ...additionalData })
      });
      const data = await res.json();
      if (data.success) {
        fetchApplications();
        if (showInterviewModal) setShowInterviewModal(false);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Update failed');
    }
  };
  const [sendingEmailId, setSendingEmailId] = useState(null);

  const handleSendEmail = async (id) => {
    setSendingEmailId(id);
    try {
      const res = await fetch(`/api/company/applications/${id}/send-email`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert('Email sent successfully.');
        fetchApplications(); // Refresh to show updated stage
      } else {
        alert(data.message || 'Unable to send email. Please try again.');
      }
    } catch (error) {
      alert('Unable to send email. Please try again.');
    } finally {
      setSendingEmailId(null);
    }
  };
  const handleScheduleInterview = (e) => {
    e.preventDefault();
    updateStage(selectedApp._id, 'Interview Scheduled', {
      interviewDate: interviewData.date,
      meetingLink: interviewData.link
    });
  };

  if (loading) return <div>Loading applicants...</div>;

  // Apply frontend filters for search and status
  const filteredApps = applications.filter(app => {
    const matchesSearch = app.studentId?.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.jobId?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || app.stage === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full min-w-0">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Candidate Tracker</h1>

      {/* Filters Section */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Search Candidates</label>
          <input 
            type="text" 
            placeholder="Search by name or job..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm font-medium"
          />
        </div>
        
        <div className="w-full md:w-56">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Filter by Job Role</label>
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm font-medium"
          >
            <option value="All Jobs">All Jobs</option>
            {jobRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-44">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm font-medium"
          >
            <option value="All Status">All Status</option>
            {STAGES.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>

        <div>
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedRole('All Jobs');
              setStatusFilter('All Status');
            }}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Pipeline Statistics Cards */}
      {(() => {
        const stats = [
          { label: 'Total Applicants', count: applications.length, iconColor: 'text-slate-700', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> },
          { label: 'Applied', count: applications.filter(a => a.stage === 'Applied').length, iconColor: 'text-blue-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> },
          { label: 'Shortlisted', count: applications.filter(a => a.stage === 'Shortlisted').length, iconColor: 'text-amber-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg> },
          { label: 'Interview', count: applications.filter(a => a.stage === 'Interview Scheduled').length, iconColor: 'text-purple-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> },
          { label: 'Selected', count: applications.filter(a => a.stage === 'Joined' || a.stage === 'Offer Released').length, iconColor: 'text-emerald-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
          { label: 'Rejected', count: applications.filter(a => a.stage === 'Rejected').length, iconColor: 'text-red-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
        ];
        return (
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-2.5 border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className={`${stat.iconColor} mb-1`}>{stat.icon}</div>
                <div className="text-lg font-bold text-slate-800">{stat.count}</div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 table-fixed">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-2 py-2.5 w-[5%]">Rank</th>
                <th className="px-2 py-2.5 w-[18%]">Candidate</th>
                <th className="px-2 py-2.5 w-[12%]">Applied Job</th>
                <th className="px-2 py-2.5 w-[11%]">Applied Date</th>
                <th className="px-2 py-2.5 w-[16%]">Skill Match</th>
                <th className="px-2 py-2.5 w-[12%]">Assessment</th>
                <th className="px-2 py-2.5 w-[15%]">Current Stage</th>
                <th className="px-2 py-2.5 text-right w-[11%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-2.5">
                    <div className={`font-black text-sm ${app.rankValue <= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {app.rankString || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="font-bold text-slate-800 text-xs truncate">{app.studentId?.userId?.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{app.studentId?.userId?.email}</div>
                    <div className="text-[10px] text-indigo-600 hover:underline mt-0.5 font-medium">
                      <a href={app.studentId?.resumeUrl} target="_blank" rel="noreferrer">View Resume</a>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="font-semibold text-slate-700 text-xs truncate">{app.jobId?.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">{app.jobId?.department}</div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="text-slate-700 font-medium text-xs">
                      {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(app.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${app.aiResumeScore >= 70 ? 'bg-emerald-100 text-emerald-700' : app.aiResumeScore >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {app.aiResumeScore || 0}%
                      </div>
                      <div className="text-[10px] text-slate-500 min-w-0">
                        <div className="font-semibold text-slate-700 truncate">{app.assessmentResult?.domain || 'N/A'}</div>
                        <div>Exp: {app.aiExperienceMatch || 0}%</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    {app.assessmentResult ? (
                      <div>
                        <div className={`font-bold text-base ${app.assessmentResult.percentage >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {app.assessmentResult.percentage}%
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${app.assessmentResult.passFail === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {app.assessmentResult.passFail}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Test: {new Date(app.assessmentResult.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs">Not Taken</div>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <select 
                      value={app.stage}
                      onChange={(e) => {
                        const stage = e.target.value;
                        if (stage === 'Interview Scheduled') {
                          setSelectedApp(app);
                          setInterviewData({ date: '', link: '' });
                          setShowInterviewModal(true);
                        } else {
                          updateStage(app._id, stage);
                        }
                      }}
                      className={`text-[10px] font-bold rounded-lg px-2 py-1 border outline-none cursor-pointer w-full
                        ${app.stage === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        ${app.stage === 'Joined' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                        ${app.stage !== 'Rejected' && app.stage !== 'Joined' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''}
                      `}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button 
                      onClick={() => handleSendEmail(app._id)}
                      disabled={sendingEmailId === app._id}
                      className="text-[10px] font-bold text-white bg-[#0B1E40] hover:bg-[#152d54] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {sendingEmailId === app._id ? 'Sending...' : 'Send Email'}
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-2 py-12 text-center text-slate-500">
                    No applications match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interview Scheduling Modal */}
      {showInterviewModal && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Schedule Interview</h2>
              <button onClick={() => setShowInterviewModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleScheduleInterview} className="p-6 space-y-4">
              <div className="mb-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900 text-sm">
                Scheduling interview for <strong>{selectedApp.studentId?.userId?.name}</strong> for the position of <strong>{selectedApp.jobId?.title}</strong>.
                <br/>
                <span className="text-xs opacity-75 mt-1 block">An automated Email and SMS will be sent to the candidate upon confirming.</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date & Time</label>
                <input required type="datetime-local" value={interviewData.date} onChange={e => setInterviewData({...interviewData, date: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Link</label>
                <input required type="url" value={interviewData.link} onChange={e => setInterviewData({...interviewData, link: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
              </div>

              <div className="pt-4 mt-2 flex gap-3">
                <button type="button" onClick={() => setShowInterviewModal(false)} className="flex-1 px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
