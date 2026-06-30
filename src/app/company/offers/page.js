'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyOffers() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/company/offers');
      if (res.status === 401) {
        router.push('/company/login');
        return;
      }
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

  const withdrawOffer = async (id) => {
    if (!confirm('Are you sure you want to withdraw this offer?')) return;
    try {
      await fetch(`/api/company/offers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Withdrawn' })
      });
      fetchOffers();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8">Loading offers...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Company Portal - Offers</h1>
        <div className="space-x-4">
          <a href="/company/dashboard" className="text-sm font-medium text-slate-300 hover:text-white">Dashboard</a>
          <a href="/company/interviews" className="text-sm font-medium text-slate-300 hover:text-white">Interviews</a>
        </div>
      </header>
      
      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Generated Offers</h2>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <th className="p-4 font-bold">Offer ID</th>
                <th className="p-4 font-bold">Candidate</th>
                <th className="p-4 font-bold">Role & Package</th>
                <th className="p-4 font-bold">Joining Date</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offers.map(offer => (
                <tr key={offer._id} className="hover:bg-slate-50">
                  <td className="p-4 text-xs font-mono font-bold text-slate-500">{offer.offerId}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{offer.studentId?.userId?.name}</div>
                    <div className="text-xs text-slate-500">{offer.studentId?.userId?.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-indigo-600">{offer.jobRole}</div>
                    <div className="text-xs text-slate-500">{offer.salaryPackage}</div>
                  </td>
                  <td className="p-4 text-sm font-semibold text-slate-600">
                    {new Date(offer.joiningDate).toLocaleDateString()}
                  </td>
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
                  <td className="p-4 text-right">
                    {offer.status === 'Released' && (
                      <button onClick={() => withdrawOffer(offer._id)} className="text-xs font-bold text-rose-600 hover:text-rose-800">
                        Withdraw
                      </button>
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
      </main>
    </div>
  );
}
