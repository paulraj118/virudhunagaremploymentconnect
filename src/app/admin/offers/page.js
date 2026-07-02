'use client';

import { useState, useEffect } from 'react';

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/admin/offers');
      const data = await res.json();
      if (data.success) {
        setOffers(data.offers);
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
          <h1 className="text-2xl font-bold text-slate-800">Platform Offers</h1>
          <p className="text-slate-500 text-sm">Global overview of all generated job offers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Offers</p>
          <p className="text-2xl font-black text-slate-800">{offers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50">
          <p className="text-xs font-bold text-emerald-600 uppercase">Accepted</p>
          <p className="text-2xl font-black text-emerald-700">{offers.filter(o => o.status === 'Accepted').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50">
          <p className="text-xs font-bold text-rose-600 uppercase">Rejected</p>
          <p className="text-2xl font-black text-rose-700">{offers.filter(o => o.status === 'Rejected').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm bg-indigo-50">
          <p className="text-xs font-bold text-indigo-600 uppercase">Pending</p>
          <p className="text-2xl font-black text-indigo-700">{offers.filter(o => o.status === 'Released').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-bold">Offer ID</th>
              <th className="p-4 font-bold">Candidate & College</th>
              <th className="p-4 font-bold">Company & Role</th>
              <th className="p-4 font-bold">Package</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-center">Offer Letter</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {offers.map(offer => (
              <tr key={offer._id} className="hover:bg-slate-50">
                <td className="p-4 text-xs font-mono font-bold text-slate-500">{offer.offerId}</td>
                <td className="p-4">
                  <div className="font-bold text-slate-800">{offer.studentName}</div>
                  <div className="text-xs text-slate-500">{offer.collegeName}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-indigo-600">{offer.companyId?.companyName}</div>
                  <div className="text-xs text-slate-500">{offer.jobRole}</div>
                </td>
                <td className="p-4 text-sm font-bold text-emerald-600">{offer.salaryPackage}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    offer.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                    offer.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                    offer.status === 'Withdrawn' ? 'bg-slate-200 text-slate-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    {offer.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {offer.offerLetterUrl ? (
                    <a 
                      href={offer.offerLetterUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">N/A</span>
                  )}
                </td>
              </tr>
            ))}
            {offers.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">No offers have been generated yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
