'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CollegeOffers() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/college/offers');
      if (res.status === 401) {
        router.push('/college/login');
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

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/';
    router.push('/college/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-black">C</div>
          <h1 className="text-xl font-bold">College Portal</h1>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-4">
            <Link href="/college/dashboard" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/college/offers" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Job Offers</Link>
          </nav>
          <button onClick={handleLogout} className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors shadow-sm">
            Logout
          </button>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Student Job Offers</h2>
          <p className="text-sm text-slate-500 mt-1">
            Securely synchronized offers for your students. Strictly filtered for data privacy.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="p-4 font-bold">Offer ID</th>
                  <th className="p-4 font-bold">Student Name</th>
                  <th className="p-4 font-bold">Company & Role</th>
                  <th className="p-4 font-bold">Package</th>
                  <th className="p-4 font-bold">Joining Date</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-center">Offer Letter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map(offer => (
                  <tr key={offer._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs text-slate-500">{offer.offerId}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{offer.studentName}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-indigo-600">{offer.companyName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{offer.jobRole}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-emerald-600">{offer.salaryPackage}</div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium text-sm">
                      {new Date(offer.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                        offer.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        offer.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        offer.status === 'Withdrawn' ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                        'bg-indigo-100 text-indigo-700 border border-indigo-200'
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
                    <td colSpan="7" className="p-12 text-center">
                      <div className="text-slate-400 text-sm">No offers have been generated for your students yet.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
