'use client';

import { useState, useEffect } from 'react';
import { generateOfferPDF } from '@/lib/generateOfferPDF';

export default function StudentOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/student/offers');
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

  const updateOfferStatus = async (id, status) => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this offer?`)) return;
    try {
      await fetch(`/api/student/offers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchOffers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadPDF = async (offer) => {
    try {
      // Fetch student's own profile to get the exact name matching the session
      const res = await fetch('/api/student/profile');
      const data = await res.json();
      
      let studentName = 'Candidate';
      if (data.success && data.student && data.student.userId) {
        studentName = data.student.userId.name;
      }

      // Format data for PDF generator
      const pdfData = {
        companyName: offer.companyId?.companyName || 'Unknown Company',
        jobRole: offer.jobRole,
        salaryPackage: offer.salaryPackage,
        location: offer.location,
        joiningDate: offer.joiningDate,
        expiryDate: offer.expiryDate,
        offerId: offer.offerId,
        notes: offer.notes
      };

      generateOfferPDF(pdfData, { name: studentName });
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-emerald-600 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
        <h1 className="text-3xl font-black mb-2 relative z-10">My Job Offers</h1>
        <p className="text-emerald-100 max-w-2xl relative z-10">
          Review, accept, or download your official offer letters from companies.
        </p>
      </div>

      <div className="grid gap-6">
        {offers.map(offer => (
          <div key={offer._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-black text-slate-800">{offer.companyId?.companyName}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  offer.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                  offer.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                  offer.status === 'Withdrawn' ? 'bg-slate-200 text-slate-700' :
                  'bg-indigo-100 text-indigo-700'
                }`}>
                  {offer.status}
                </span>
              </div>
              <p className="font-bold text-indigo-600 mb-4">{offer.jobRole} — <span className="text-emerald-600">{offer.salaryPackage}</span></p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Offer ID</p>
                  <p className="font-bold text-slate-700 font-mono mt-1">{offer.offerId}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Location</p>
                  <p className="font-semibold text-slate-700 mt-1">{offer.location}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Joining Date</p>
                  <p className="font-semibold text-slate-700 mt-1">{new Date(offer.joiningDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Expires On</p>
                  <p className="font-semibold text-rose-600 mt-1">{new Date(offer.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>

              {offer.notes && (
                <div className="text-sm text-slate-600 italic">
                  <span className="font-bold">Notes:</span> {offer.notes}
                </div>
              )}
            </div>
            
            <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
              <button 
                onClick={() => handleDownloadPDF(offer)}
                className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download PDF
              </button>
              
              {offer.status === 'Released' && (
                <>
                  <button 
                    onClick={() => updateOfferStatus(offer._id, 'Accepted')}
                    className="w-full text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2.5 px-6 rounded-xl transition-colors"
                  >
                    Accept Offer
                  </button>
                  <button 
                    onClick={() => updateOfferStatus(offer._id, 'Rejected')}
                    className="w-full text-center bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-6 rounded-xl transition-colors"
                  >
                    Decline
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {offers.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
            <h3 className="font-bold text-slate-700">No Offers Yet</h3>
            <p className="text-slate-500 text-sm mt-1">Keep completing interviews! Your job offers will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
