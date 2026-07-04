'use client';

import { useState, useEffect } from 'react';

export default function StudentInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetch('/api/student/interviews');
      const data = await res.json();
      if (data.success) {
        setInterviews(data.interviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-1 sm:p-2">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 transform -translate-x-12 translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <h1 className="text-2xl sm:text-3xl font-black mb-2 relative z-10 tracking-tight">My Interviews</h1>
        <p className="text-indigo-100 text-sm sm:text-base max-w-2xl relative z-10 font-medium">
          Track your scheduled recruitment rounds, check dates, and join online video interviews directly.
        </p>
      </div>

      <div className="grid gap-5">
        {interviews.map(inv => (
          <div key={inv._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row">
            <div className={`w-full sm:w-2 ${
              inv.status === 'Completed' ? 'bg-emerald-500 h-1.5 sm:h-auto' :
              inv.status === 'Cancelled' ? 'bg-rose-500 h-1.5 sm:h-auto' :
              'bg-indigo-500 h-1.5 sm:h-auto'
            }`} />

            <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4 flex-1 w-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0">
                    {inv.companyId?.companyName?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-800 tracking-tight">{inv.companyId?.companyName}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        inv.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        inv.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                      {inv.driveId?.jobRole || 'Job Role'} • <span className="text-indigo-600">{inv.type}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 w-full">
                  <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
                    <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-0.5">Date & Time</p>
                      <span className="font-semibold text-slate-700">{new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {inv.startTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
                    <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-0.5">Interviewer</p>
                      <span className="font-semibold text-slate-700">{inv.interviewerName || 'HR Coordinator'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {inv.status === 'Scheduled' && (
                <div className="w-full md:w-auto self-stretch md:self-auto flex items-center justify-end shrink-0">
                  {inv.mode === 'Online' ? (
                    <a href={inv.meetingLink} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto text-center inline-flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-200 text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Join Meeting
                    </a>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 w-full md:w-auto text-center">
                      📍 In-Person: {inv.venue}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* HR Feedback Section */}
            {inv.feedback && (inv.feedback.totalScore > 0 || inv.feedback.remarks) && (
              <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row gap-6">
                <div className="sm:w-1/3">
                  <h4 className="text-sm font-bold text-slate-800">Interview Feedback</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Score: <span className="text-indigo-600 font-extrabold text-lg">{inv.feedback.totalScore}</span> <span className="text-slate-400">/ 50</span></p>
                </div>
                <div className="sm:w-2/3 space-y-4">
                  {inv.feedback.strengths && (
                    <div>
                      <h5 className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Strengths</h5>
                      <p className="text-sm text-slate-700 mt-1">{inv.feedback.strengths}</p>
                    </div>
                  )}
                  {inv.feedback.weaknesses && (
                    <div>
                      <h5 className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Areas for Improvement</h5>
                      <p className="text-sm text-slate-700 mt-1">{inv.feedback.weaknesses}</p>
                    </div>
                  )}
                  {inv.feedback.remarks && (
                    <div>
                      <h5 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Remarks</h5>
                      <p className="text-sm text-slate-700 mt-1 italic">"{inv.feedback.remarks}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {interviews.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed p-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-700 text-lg">No Interviews Scheduled</h3>
            <p className="text-slate-500 text-sm mt-1.5 max-w-sm mx-auto">
              When a company schedules an interview with you, the details and meeting links will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
