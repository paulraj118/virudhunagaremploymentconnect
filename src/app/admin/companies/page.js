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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 hover:scale-[1.02] transition-all duration-300 transform flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] group">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 transition-transform duration-300 group-hover:scale-110 shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Companies</div>
            <div className="text-3xl font-black text-blue-600 tracking-tight">{companies.length}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5 hover:scale-[1.02] transition-all duration-300 transform flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] group">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110 shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"></path></svg>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Active Companies</div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{companies.filter(c => c.status === 'Approved').length}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/5 hover:scale-[1.02] transition-all duration-300 transform flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] group">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 transition-transform duration-300 group-hover:scale-110 shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pending Approvals</div>
            <div className="text-3xl font-black text-amber-600 tracking-tight">{companies.filter(c => c.status === 'Pending').length}</div>
          </div>
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
