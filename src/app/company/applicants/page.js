'use client';

import { useState, useEffect } from 'react';

export default function PlacementTracking() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Interview Modal state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState({ date: '', link: '' });

  const STAGES = [
    'Applied', 'Assessment Completed', 'Shortlisted', 'Interview Scheduled', 
    'Interview Cleared', 'Offer Released', 'Joined', 'Rejected'
  ];

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/company/applications');
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

  const handleScheduleInterview = (e) => {
    e.preventDefault();
    updateStage(selectedApp._id, 'Interview Scheduled', {
      interviewDate: interviewData.date,
      meetingLink: interviewData.link
    });
  };

  if (loading) return <div>Loading applicants...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Pipeline Tracker</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Applied Job</th>
                <th className="px-6 py-4">Applied Date</th>
                <th className="px-6 py-4">Skill Match</th>
                <th className="px-6 py-4">Assessment Status</th>
                <th className="px-6 py-4">Current Stage</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{app.studentId?.userId?.name}</div>
                    <div className="text-xs text-slate-500">{app.studentId?.userId?.email}</div>
                    <div className="text-xs text-indigo-600 hover:underline mt-1 font-medium">
                      <a href={app.studentId?.resumeUrl} target="_blank" rel="noreferrer">View Resume</a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700">{app.jobId?.title}</div>
                    <div className="text-xs text-slate-500">{app.jobId?.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700 font-medium text-sm">
                      {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(app.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${app.aiResumeScore >= 70 ? 'bg-emerald-100 text-emerald-700' : app.aiResumeScore >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {app.aiResumeScore || 0}%
                      </div>
                      <div className="text-xs text-slate-500">
                        <div className="font-semibold text-slate-700 truncate max-w-[120px]">{app.assessmentResult?.domain || 'N/A'}</div>
                        <div>Exp: {app.aiExperienceMatch || 0}%</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {app.assessmentResult ? (
                      <div>
                        <div className={`font-bold text-lg ${app.assessmentResult.percentage >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {app.assessmentResult.percentage}%
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${app.assessmentResult.passFail === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {app.assessmentResult.passFail}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Test: {new Date(app.assessmentResult.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm">Not Taken</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={app.stage}
                      onChange={(e) => updateStage(app._id, e.target.value)}
                      className={`text-xs font-bold rounded-lg px-3 py-1.5 border outline-none cursor-pointer
                        ${app.stage === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        ${app.stage === 'Joined' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                        ${app.stage !== 'Rejected' && app.stage !== 'Joined' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''}
                      `}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedApp(app);
                        setInterviewData({ date: '', link: `https://meet.google.com/job-${Math.floor(Math.random()*10000)}` });
                        setShowInterviewModal(true);
                      }}
                      className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors"
                    >
                      Schedule Interview
                    </button>
                  </td>
                </tr>
              ))}
              
              {applications.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-slate-500">
                    No applications received yet.
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
