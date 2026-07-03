'use client';

import { useState, useEffect } from 'react';

const SearchIcon = () => (
  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const AlertIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

const CrossIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
);

export default function CollegeApprovalsPage() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const res = await fetch('/api/admin/approvals/colleges');
      const data = await res.json();
      if (data.success) {
        setColleges(data.pendingColleges);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (!confirm(`Are you sure you want to ${action} this college?`)) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/approvals/colleges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setColleges(prev => prev.map(c => c._id === id ? { ...c, approvalStatus: action === 'approve' ? 'Approved' : 'Rejected' } : c));
      } else {
        alert(data.message || `Failed to ${action} college`);
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredColleges = colleges.filter(college => 
    college.collegeName.toLowerCase().includes(search.toLowerCase()) ||
    college.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">College Approvals</h1>
          <p className="text-slate-500 mt-1">Review and manage college registrations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="relative w-full md:w-96">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search colleges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            {filteredColleges.length} colleges
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm">College Info</th>
                <th className="p-4 font-semibold text-sm">Contact Details</th>
                <th className="p-4 font-semibold text-sm">Location</th>
                <th className="p-4 font-semibold text-sm">Registered On</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading pending colleges...
                  </td>
                </tr>
              ) : filteredColleges.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    <AlertIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-600">No pending approvals</p>
                    <p className="text-sm">All college registrations have been processed.</p>
                  </td>
                </tr>
              ) : (
                filteredColleges.map((college) => (
                  <tr key={college._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{college.collegeName}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">Code: {college.collegeCode}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-700">{college.contactPerson}</div>
                      <div className="text-sm text-slate-500">{college.email}</div>
                      <div className="text-sm text-slate-500">{college.mobile}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-700">{college.district}</div>
                      <div className="text-sm text-slate-500">{college.state}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-700">
                        {new Date(college.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                      <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${
                        college.approvalStatus === 'Approved' ? 'text-green-600 bg-green-50' :
                        college.approvalStatus === 'Rejected' ? 'text-red-600 bg-red-50' :
                        'text-amber-600 bg-amber-50'
                      }`}>
                        {college.approvalStatus || 'Pending'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {college.approvalStatus === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(college._id, 'approve')}
                            disabled={actionLoading === college._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            <CheckIcon className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(college._id, 'reject')}
                            disabled={actionLoading === college._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            <CrossIcon className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
