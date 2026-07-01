'use client';

import { useState, useEffect } from 'react';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await fetch(`/api/admin/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchCompanies();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Company Management</h1>
          <p className="text-slate-500 text-sm">Approve or reject registering companies.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-bold">Company</th>
              <th className="p-4 font-bold">HR Contact</th>
              <th className="p-4 font-bold">Industry</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {companies.map(company => (
              <tr key={company._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-800">{company.companyName}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{company.companyCode}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-700">{company.hrName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{company.hrEmail}</div>
                  <div className="text-xs text-slate-500">{company.mobileNumber}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{company.industry}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full ${
                    company.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                    company.status === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    company.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {company.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {company.status === 'Pending' && (
                      <>
                        <button onClick={() => handleStatusUpdate(company._id, 'Approved')} className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">Approve</button>
                        <button onClick={() => handleStatusUpdate(company._id, 'Rejected')} className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors">Reject</button>
                      </>
                    )}
                    {company.status === 'Approved' && (
                      <button onClick={() => handleStatusUpdate(company._id, 'Inactive')} className="px-3 py-1.5 text-xs font-semibold bg-slate-50 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">Suspend</button>
                    )}
                    {company.status === 'Inactive' && (
                      <button onClick={() => handleStatusUpdate(company._id, 'Approved')} className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">Activate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No companies found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
