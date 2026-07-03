'use client';

import { useState, useEffect } from 'react';

export default function CollegeInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetch('/api/college/interviews');
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
    <div className="min-h-screen bg-slate-50 flex flex-col">


      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Student Interview Schedules</h2>
          <p className="text-slate-500 text-sm mt-1">Track the interview progress of your college's students.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <th className="p-4 font-bold">Student</th>
                <th className="p-4 font-bold">Company & Role</th>
                <th className="p-4 font-bold">Interview Details</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interviews.map(inv => (
                <tr key={inv._id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{inv.studentName}</div>
                    <div className="text-xs text-slate-500">{inv.degree} - {inv.department}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-indigo-600">{inv.companyId?.companyName}</div>
                    <div className="text-sm text-slate-700">{inv.driveId?.jobRole}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    <div className="font-semibold">{inv.type} ({inv.mode})</div>
                    <div className="text-xs mt-1">📅 {new Date(inv.date).toLocaleDateString()} at {inv.startTime}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      inv.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
              {interviews.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">No interviews found for your students.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
