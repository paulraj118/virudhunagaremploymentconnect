'use client';

import { useState, useEffect } from 'react';

export default function CompanyApprovals() {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    if (!confirm(`Are you sure you want to mark this company as ${status}?`)) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchCompanies();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading companies...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Company Approvals</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="text-sm font-semibold text-slate-500 mb-1">Total Companies</div>
            <div className="text-3xl font-bold text-slate-800">{stats.totalCompanies}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="text-sm font-semibold text-slate-500 mb-1">Active Companies</div>
            <div className="text-3xl font-bold text-emerald-600">{stats.activeCompanies}</div>
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
                <th className="px-6 py-4">Company Info</th>
                <th className="px-6 py-4">HR Contact</th>
                <th className="px-6 py-4">Industry & Size</th>
                <th className="px-6 py-4">GST Number</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((company) => (
                <tr key={company._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{company.companyName}</div>
                    <div className="text-xs text-blue-600 hover:underline">
                      <a href={company.website} target="_blank" rel="noreferrer">{company.website}</a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">{company.hrName}</div>
                    <div className="text-xs text-slate-500">{company.userId?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700">{company.industryType}</div>
                    <div className="text-xs text-slate-500">{company.companySize} employees</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{company.gstNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${company.approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                      ${company.approvalStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                      ${company.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                      ${company.approvalStatus === 'suspended' ? 'bg-slate-100 text-slate-700 border-slate-300' : ''}
                    `}>
                      {company.approvalStatus.charAt(0).toUpperCase() + company.approvalStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {company.approvalStatus === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleAction(company._id, 'approved')}
                          disabled={actionLoading === company._id}
                          className="text-emerald-600 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors text-xs"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(company._id, 'rejected')}
                          disabled={actionLoading === company._id}
                          className="text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {company.approvalStatus === 'approved' && (
                      <button 
                        onClick={() => handleAction(company._id, 'suspended')}
                        disabled={actionLoading === company._id}
                        className="text-slate-500 hover:text-red-600 font-medium transition-colors text-xs"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {companies.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No companies registered yet.
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
