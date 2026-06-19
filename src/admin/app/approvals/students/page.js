'use client';

import { useState, useEffect } from 'react';

export default function StudentApprovals() {
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await fetch('/api/admin/enrollments');
      const data = await res.json();
      if (data.success) {
        setEnrollments(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    if (!confirm(`Are you sure you want to ${status} this student?`)) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh list
        fetchEnrollments();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading enrollments...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Student Approvals</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="text-sm font-semibold text-slate-500 mb-1">Total Enrollments</div>
            <div className="text-3xl font-bold text-slate-800">{stats.totalEnrollments}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="text-sm font-semibold text-slate-500 mb-1">Active Students</div>
            <div className="text-3xl font-bold text-emerald-600">{stats.activeStudents}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="text-sm font-semibold text-slate-500 mb-1">Pending Approvals</div>
            <div className="text-3xl font-bold text-amber-600">{stats.pendingApprovals}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Academic Details</th>
                <th className="px-6 py-4">Preferred Domain</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((student) => (
                <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{student.userId?.name}</div>
                    <div className="text-xs text-slate-500">{student.userId?.email}</div>
                    <div className="text-xs text-slate-500">{student.userId?.mobile}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">{student.degree} in {student.department}</div>
                    <div className="text-xs text-slate-500">{student.collegeName} • Passed Out: {student.yearOfPassedOut} • Exp: {student.yearsOfExperience || 0} yrs</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {student.preferredDomain}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${student.enrollmentStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                      ${student.enrollmentStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                      ${student.enrollmentStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                    `}>
                      {student.enrollmentStatus.charAt(0).toUpperCase() + student.enrollmentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {student.enrollmentStatus === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleAction(student._id, 'approved')}
                          disabled={actionLoading === student._id}
                          className="text-emerald-600 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors text-xs"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(student._id, 'rejected')}
                          disabled={actionLoading === student._id}
                          className="text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {student.enrollmentStatus === 'approved' && (
                      <button 
                        onClick={() => handleAction(student._id, 'rejected')}
                        disabled={actionLoading === student._id}
                        className="text-slate-500 hover:text-red-600 font-medium transition-colors text-xs"
                      >
                        Revoke Access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No enrollments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
