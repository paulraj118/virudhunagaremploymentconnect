'use client';

import { useState, useEffect } from 'react';

export default function OfferLetterDashboard() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [jobRoles, setJobRoles] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [genders, setGenders] = useState([]);
  
  const [selectedRole, setSelectedRole] = useState('All Jobs');
  const [selectedCollege, setSelectedCollege] = useState('All Colleges');
  const [selectedGender, setSelectedGender] = useState('All Genders');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/company/offers');
      const data = await res.json();
      
      if (data.success) {
        setOffers(data.offers);
        
        // Extract filters
        const uniqueRoles = [...new Set(data.offers.map(o => o.jobRole))].filter(Boolean);
        setJobRoles(uniqueRoles);
        
        const uniqueColleges = [...new Set(data.offers.map(o => o.studentId?.userId?.collegeId?.collegeName || 'Unknown College'))].filter(Boolean);
        setColleges(uniqueColleges);
        
        const uniqueGenders = [...new Set(data.offers.map(o => o.studentId?.gender))].filter(Boolean);
        setGenders(uniqueGenders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawOffer = async (id) => {
    if (!confirm('Are you sure you want to withdraw this offer?')) return;
    try {
      await fetch(`/api/company/offers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Withdrawn' })
      });
      fetchOffers();
      if (selectedOffer && selectedOffer._id === id) {
        setSelectedOffer({ ...selectedOffer, status: 'Withdrawn' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Metrics
  const totalOffers = offers.length;
  const acceptedOffers = offers.filter(o => o.status === 'Accepted').length;
  const pendingOffers = offers.filter(o => !['Accepted', 'Rejected', 'Withdrawn'].includes(o.status)).length;
  const offerRate = totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0;

  const filteredOffers = offers.filter(offer => {
    const student = offer.studentId || {};
    const user = student.userId || {};
    const collegeName = user.collegeId?.collegeName || 'Unknown College';

    if (selectedRole !== 'All Jobs' && offer.jobRole !== selectedRole) return false;
    if (selectedCollege !== 'All Colleges' && collegeName !== selectedCollege) return false;
    if (selectedGender !== 'All Genders' && student.gender !== selectedGender) return false;
    
    if (selectedStatus === 'Pending' && ['Accepted', 'Rejected', 'Withdrawn'].includes(offer.status)) return false;
    if (selectedStatus === 'Accepted' && offer.status !== 'Accepted') return false;
    if (selectedStatus === 'Declined' && offer.status !== 'Rejected') return false;
    if (selectedStatus === 'Withdrawn' && offer.status !== 'Withdrawn') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = user.name?.toLowerCase().includes(q);
      const matchEmail = user.email?.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    
    return true;
  });

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Offer Letters Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">Track and manage candidate offer statuses</p>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Total Offers Sent</p>
            <p className="text-3xl font-black text-slate-800">{loading ? '-' : totalOffers}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-emerald-600 text-sm font-bold uppercase tracking-wider mb-1">Offers Accepted</p>
            <p className="text-3xl font-black text-slate-800">{loading ? '-' : acceptedOffers}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-amber-600 text-sm font-bold uppercase tracking-wider mb-1">Pending Responses</p>
            <p className="text-3xl font-black text-slate-800">{loading ? '-' : pendingOffers}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-blue-600 text-sm font-bold uppercase tracking-wider mb-1">Acceptance Rate</p>
            <p className="text-3xl font-black text-slate-800">{loading ? '-' : `${offerRate}%`}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search candidates..."
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="All Jobs">All Job Roles</option>
          {jobRoles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        
        <select
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
        >
          <option value="All Colleges">All Colleges</option>
          {colleges.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
          value={selectedGender}
          onChange={(e) => setSelectedGender(e.target.value)}
        >
          <option value="All Genders">All Genders</option>
          {genders.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All Status">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
          <option value="Withdrawn">Withdrawn</option>
        </select>
      </div>

      {/* Candidate List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-20 text-center text-slate-500">
            No candidates found matching the criteria.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Job Role</th>
                <th className="px-6 py-4">College</th>
                <th className="px-6 py-4">Offered Salary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOffers.map((offer) => {
                const isAccepted = offer.status === 'Accepted';
                const isRejected = offer.status === 'Rejected';
                const isWithdrawn = offer.status === 'Withdrawn';
                const isPending = !isAccepted && !isRejected && !isWithdrawn;
                
                let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                let statusText = offer.status || 'Pending';
                
                if (isAccepted) badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (isRejected) badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                if (isWithdrawn) badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';

                return (
                  <tr key={offer._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{offer.studentId?.userId?.name || 'Candidate'}</p>
                      <p className="text-slate-500 text-xs">{offer.studentId?.userId?.email}</p>
                      {offer.studentId?.gender && (
                        <span className="text-[10px] font-medium text-slate-400 mt-0.5 inline-block bg-slate-100 px-2 py-0.5 rounded">{offer.studentId.gender}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {offer.jobRole || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {offer.studentId?.userId?.collegeId?.collegeName || 'Unknown College'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {offer.salaryPackage || 'Not specified'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => setSelectedOffer(offer)}
                        className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg text-xs"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* View Offer Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-xl text-slate-800">Offer Details</h3>
              <button onClick={() => setSelectedOffer(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Candidate Name</p>
                  <p className="font-bold text-slate-800">{selectedOffer.studentId?.userId?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Role</p>
                  <p className="font-bold text-slate-800">{selectedOffer.jobRole}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Salary Package</p>
                  <p className="font-bold text-slate-800">{selectedOffer.salaryPackage || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Joining Date</p>
                  <p className="font-bold text-slate-800">
                    {selectedOffer.joiningDate ? new Date(selectedOffer.joiningDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Location</p>
                  <p className="font-bold text-slate-800">{selectedOffer.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                  <p className={`font-bold ${selectedOffer.status === 'Accepted' ? 'text-emerald-600' : selectedOffer.status === 'Rejected' ? 'text-rose-600' : selectedOffer.status === 'Withdrawn' ? 'text-slate-500' : 'text-blue-600'}`}>
                    {selectedOffer.status || 'Pending'}
                  </p>
                </div>
              </div>
              
              {selectedOffer.notes && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Additional Notes</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {selectedOffer.notes}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between">
              {(!selectedOffer.status || !['Accepted', 'Rejected', 'Withdrawn'].includes(selectedOffer.status)) ? (
                <button 
                  onClick={() => handleWithdrawOffer(selectedOffer._id)}
                  className="px-4 py-2 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-colors border border-transparent hover:border-rose-200"
                >
                  Withdraw Offer
                </button>
              ) : <div></div>}
              <button 
                onClick={() => setSelectedOffer(null)} 
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
