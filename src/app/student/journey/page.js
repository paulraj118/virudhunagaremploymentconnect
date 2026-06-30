'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STAGES = [
  'Applied',
  'College Recommended',
  'Admin Verified',
  'Company Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Selected',
  'Rejected'
];

export default function StudentJourneyPage() {
  const [applications, setApplications] = useState([]);
  const [drives, setDrives] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourney();
  }, []);

  const fetchJourney = async () => {
    try {
      // In a real app we'd create an API /api/student/journey returning populated drive details
      // Since we don't have it explicitly requested to be a new route in the prompt, we'll assume we can call `/api/student/drives`
      // Or I can create `/api/student/journey` real quick since this is Phase 9.
      const res = await fetch('/api/student/journey');
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
        const driveMap = {};
        data.drives.forEach(d => driveMap[d._id] = d);
        setDrives(driveMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStageIndex = (status) => {
    if (status === 'Rejected') return STAGES.length; // Max out for rejected
    return STAGES.indexOf(status);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">My Recruitment Journey</h1>
        <p className="text-slate-500 mt-1">Track the real-time status of your job applications.</p>
      </div>

      <div className="space-y-6">
        {applications.map(app => {
          const drive = drives[app.driveId] || {};
          const currentIndex = getStageIndex(app.status);
          const isRejected = app.status === 'Rejected';

          return (
            <div key={app._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{drive.jobRole || 'Unknown Role'}</h2>
                  <p className="font-semibold text-indigo-600">{drive.companyName || 'Unknown Company'}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  isRejected ? 'bg-rose-100 text-rose-700' :
                  app.status === 'Selected' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-indigo-50 text-indigo-700'
                }`}>
                  {app.status}
                </div>
              </div>

              {/* Status Timeline */}
              <div className="relative pt-8 pb-4">
                <div className="absolute top-10 left-0 w-full h-1 bg-slate-100 rounded"></div>
                <div className={`absolute top-10 left-0 h-1 rounded transition-all duration-500 ${isRejected ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${(Math.min(currentIndex, 6) / 6) * 100}%` }}></div>
                
                <div className="relative flex justify-between w-full">
                  {STAGES.slice(0, 7).map((stage, idx) => {
                    const isCompleted = currentIndex >= idx;
                    const isCurrent = currentIndex === idx;
                    const isFailedStage = isRejected && isCurrent;

                    return (
                      <div key={stage} className="flex flex-col items-center relative z-10 w-10">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white ${
                          isFailedStage ? 'border-rose-500 text-rose-500' :
                          isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' :
                          'border-slate-300'
                        }`}>
                          {isFailedStage ? '✕' : isCompleted ? '✓' : ''}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 mt-2 text-center absolute top-6 w-20 leading-tight">
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {app.status === 'Interview Scheduled' && (
                <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-start">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-800 text-sm">Action Required: Interview Scheduled!</h4>
                    <p className="text-amber-700 text-xs mt-1">Please ensure you are ready at the designated time.</p>
                    <div className="mt-2 text-xs font-semibold text-amber-900 grid grid-cols-2 gap-2">
                      <div>Date: {app.interviewDate ? new Date(app.interviewDate).toLocaleString() : 'TBD'}</div>
                      <div>Location/Link: {app.interviewLocation || 'TBD'}</div>
                    </div>
                  </div>
                </div>
              )}

              {app.remarks && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Recruiter Remarks</p>
                  <p className="text-sm text-slate-700 mt-1 italic">"{app.remarks}"</p>
                </div>
              )}

            </div>
          );
        })}

        {applications.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
            <h3 className="font-bold text-slate-700">No Applications Found</h3>
            <p className="text-slate-500 text-sm mt-1 mb-4">You haven't applied to any recruitment drives yet.</p>
            <Link href="/student/drives" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
              Browse Available Drives
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
