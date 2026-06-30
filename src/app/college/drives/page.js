'use client';

import { useState, useEffect } from 'react';

export default function CollegeDrivesPage() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const res = await fetch('/api/college/drives');
      const data = await res.json();
      if (data.success) {
        setDrives(data.drives);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-black">C</div>
          <h1 className="text-xl font-bold">College Portal - Recruitment Drives</h1>
        </div>
        <div className="flex gap-4">
          <a href="/college/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Dashboard</a>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Available Recruitment Drives</h2>
          <p className="text-slate-500 text-sm">View published opportunities for your students.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map(drive => (
            <div key={drive._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{drive.jobRole}</h3>
                  <p className="text-sm font-semibold text-indigo-600">{drive.companyName}</p>
                </div>
                <span className="px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">{drive.status}</span>
              </div>
              
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{drive.jobDescription}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs border-b border-slate-50 pb-1">
                  <span className="text-slate-500 font-semibold">Min Assessment</span>
                  <span className="font-bold text-slate-700">{drive.minAssessmentScore}%</span>
                </div>
                <div className="flex justify-between text-xs border-b border-slate-50 pb-1">
                  <span className="text-slate-500 font-semibold">Min Employability</span>
                  <span className="font-bold text-slate-700">{drive.minEmployabilityScore}/100</span>
                </div>
                {drive.minCgpa && (
                  <div className="flex justify-between text-xs border-b border-slate-50 pb-1">
                    <span className="text-slate-500 font-semibold">Min CGPA</span>
                    <span className="font-bold text-slate-700">{drive.minCgpa}</span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {drive.salaryPackage || 'Not disclosed'}
                </div>
                <button className="text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                  View Eligible Students
                </button>
              </div>
            </div>
          ))}
          {drives.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white rounded-xl border border-slate-200 border-dashed">
              No recruitment drives currently published.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
