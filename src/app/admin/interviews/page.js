'use client';

import { useState, useEffect } from 'react';

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetch('/api/admin/interviews');
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Platform Interviews</h1>
          <p className="text-slate-500 text-sm">Global overview of all scheduled interviews.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-bold">Candidate</th>
              <th className="p-4 font-bold">College</th>
              <th className="p-4 font-bold">Company & Role</th>
              <th className="p-4 font-bold">Schedule</th>
              <th className="p-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {interviews.map(inv => (
              <tr key={inv._id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800">{inv.studentName}</td>
                <td className="p-4 text-sm text-slate-600">{inv.collegeName}</td>
                <td className="p-4">
                  <div className="font-bold text-indigo-600">{inv.companyId?.companyName}</div>
                  <div className="text-xs text-slate-500">{inv.driveId?.jobRole} - {inv.type}</div>
                </td>
                <td className="p-4 text-sm text-slate-600">
                  <div className="font-semibold">{new Date(inv.date).toLocaleDateString()}</div>
                  <div className="text-xs">{inv.startTime} - {inv.endTime}</div>
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
                <td colSpan="5" className="p-8 text-center text-slate-500">No interviews have been scheduled yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
