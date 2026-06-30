'use client';

import { useState, useEffect } from 'react';

export default function StudentDrivesPage() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const res = await fetch('/api/student/drives');
      const data = await res.json();
      if (data.success) {
        setDrives(data.eligibleDrives);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id) => {
    try {
      const res = await fetch(`/api/student/drives/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply' })
      });
      const data = await res.json();
      if (data.success) {
        fetchDrives();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleWithdraw = async (id) => {
    try {
      const res = await fetch(`/api/student/drives/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw' })
      });
      const data = await res.json();
      if (data.success) {
        fetchDrives();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">My Recruitment Drives</h1>
          <p className="text-indigo-100 max-w-2xl">
            These are the job opportunities where you meet the strict eligibility criteria based on your Assessment Score, Employability Score, and Profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drives.map(drive => (
          <div key={drive._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group hover:border-indigo-300 transition-colors">
            
            {drive.isApplied && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">
                {drive.applicationStatus}
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-black text-xl text-slate-800">{drive.jobRole}</h3>
              <p className="font-bold text-indigo-600">{drive.companyName}</p>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 line-clamp-3">{drive.jobDescription}</p>
            
            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="font-semibold">{drive.location || 'Remote'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="font-semibold">{drive.salaryPackage || 'Competitive'}</span>
              </div>
            </div>

            <div className="mt-auto pt-2 flex items-center justify-between">
              {drive.isApplied ? (
                <button 
                  onClick={() => handleWithdraw(drive._id)}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Withdraw Application
                </button>
              ) : (
                <button 
                  onClick={() => handleApply(drive._id)}
                  className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-md"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        ))}
        {drives.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Eligible Drives Yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              We couldn't find any drives matching your current Assessment and Employability Scores. Keep improving your skills!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
