'use client';

import { useState, useEffect } from 'react';

export default function StudentDrivesPage() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrive, setSelectedDrive] = useState(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const res = await fetch('/api/student/drives', { cache: 'no-store' });
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
        // If modal is open, update selectedDrive status too
        if (selectedDrive && selectedDrive._id === id) {
          setSelectedDrive(prev => ({ ...prev, isApplied: true, applicationStatus: 'Applied' }));
        }
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
        // If modal is open, update selectedDrive status too
        if (selectedDrive && selectedDrive._id === id) {
          setSelectedDrive(prev => ({ ...prev, isApplied: false, applicationStatus: null }));
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">Placement & Recruitment Drives</h1>
          <p className="text-indigo-100 max-w-2xl text-sm">
            View all available job opportunities, verify your eligibility, and apply directly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drives.map(drive => (
          <div key={drive._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group hover:border-indigo-300 transition-colors">
            
            {/* Top Badges */}
            <div className="absolute top-0 right-0 flex items-center gap-1.5 z-10">
              {drive.isApplied && (
                <div className="bg-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                  {drive.applicationStatus || 'Applied'}
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-black text-xl text-slate-800 line-clamp-1">{drive.jobRole}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 mt-1 ${
                  drive.isEligible 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {drive.isEligible ? '✅ Eligible' : '❌ Not Eligible'}
                </span>
              </div>
              <p className="font-bold text-indigo-600 text-sm">{drive.companyName}</p>
              
              <div className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                <span>🏫 Created By:</span>
                <span className="text-slate-600">
                  {drive.createdByText === 'Admin' ? 'Admin' : drive.createdByText}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 line-clamp-3 flex-1">{drive.jobDescription}</p>
            
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

            <div className="mt-auto pt-2 flex gap-2">
              <button 
                onClick={() => setSelectedDrive(drive)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                View Details
              </button>

              {drive.isEligible ? (
                drive.isApplied ? (
                  <button 
                    onClick={() => handleWithdraw(drive._id)}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Withdraw
                  </button>
                ) : (
                  <button 
                    onClick={() => handleApply(drive._id)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-indigo-900/10"
                  >
                    Apply Now
                  </button>
                )
              ) : (
                <button 
                  disabled
                  className="flex-1 bg-slate-100 text-slate-400 font-bold py-2.5 rounded-xl text-xs cursor-not-allowed"
                  title="You do not meet the eligibility requirements for this drive"
                >
                  Apply (Not Eligible)
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
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Recruitment Drives</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              There are no published placement drives available at this time.
            </p>
          </div>
        )}
      </div>

      {/* Drive Details Modal */}
      {selectedDrive && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-slate-800">Recruitment Drive Details</h3>
              <button 
                onClick={() => setSelectedDrive(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors text-2xl font-light"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h4 className="text-2xl font-black text-slate-800">{selectedDrive.jobRole}</h4>
                  <p className="text-lg font-bold text-indigo-600 mt-1">{selectedDrive.companyName}</p>
                  
                  <div className="text-xs text-slate-500 font-semibold mt-2 flex items-center gap-1">
                    <span>🏫 Created By:</span>
                    <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                      {selectedDrive.createdByText === 'Admin' ? 'Admin' : selectedDrive.createdByText}
                    </span>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                  selectedDrive.isEligible 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {selectedDrive.isEligible ? '✅ Eligible' : '❌ Not Eligible'}
                </span>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Location</p>
                  <p className="text-slate-850 font-bold mt-1">{selectedDrive.location || 'Remote'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Salary Package</p>
                  <p className="text-emerald-600 font-bold mt-1">{selectedDrive.salaryPackage || 'Competitive'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Registration Deadline</p>
                  <p className="text-slate-850 font-bold mt-1">
                    {selectedDrive.lastDate 
                      ? new Date(selectedDrive.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Interview Date</p>
                  <p className="text-slate-850 font-bold mt-1">
                    {selectedDrive.interviewDate 
                      ? new Date(selectedDrive.interviewDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Drive Status</p>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 inline-block mt-1">
                    {selectedDrive.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Vacancies</p>
                  <p className="text-slate-850 font-bold mt-1">{selectedDrive.vacancies ? `${selectedDrive.vacancies} Positions` : 'Open'}</p>
                </div>
              </div>

              {/* Description */}
              <div className="pt-6 border-t border-slate-100">
                <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2.5">Job Description</p>
                <p className="text-slate-650 leading-relaxed text-sm whitespace-pre-line">{selectedDrive.jobDescription}</p>
              </div>

              {/* Eligibility Criteria Details */}
              <div className="pt-6 border-t border-slate-100">
                <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Eligibility Requirements</p>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Min Assessment Score</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedDrive.minAssessmentScore || 0}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Min Employability Score</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedDrive.minEmployabilityScore || 0}/100</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Min CGPA required</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedDrive.minCgpa || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Max Active Arrears allowed</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedDrive.maxActiveArrears ?? 'No Limit'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              {selectedDrive.isEligible ? (
                selectedDrive.isApplied ? (
                  <button
                    onClick={() => handleWithdraw(selectedDrive._id)}
                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    Withdraw Application
                  </button>
                ) : (
                  <button
                    onClick={() => handleApply(selectedDrive._id)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-900/10"
                  >
                    Apply Now
                  </button>
                )
              ) : (
                <button
                  disabled
                  className="px-5 py-2.5 bg-slate-200 text-slate-400 font-bold rounded-xl text-sm cursor-not-allowed"
                >
                  Apply (Not Eligible)
                </button>
              )}
              <button
                onClick={() => setSelectedDrive(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
