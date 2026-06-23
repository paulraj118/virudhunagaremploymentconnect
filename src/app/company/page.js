'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CompanyDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState(null); // null means not registered
  const [stats, setStats] = useState({ activeJobs: 0, totalApplicants: 0, interviews: 0, hired: 0 });
  const [trendsData, setTrendsData] = useState(Array(7).fill(0));
  
  const [formData, setFormData] = useState({
    companyName: '', hrName: '', website: '', address: '',
    linkedIn: '', description: '', industryType: 'IT Services', companySize: '1-50', dpiitRegistered: 'No'
  });

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`hrRegistrationForm_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) {
            setFormData(prev => ({ ...prev, ...parsed }));
          }
        } catch(e) { console.error(e) }
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && user && user.role === 'hr_company') {
      fetchCompanyStatus();
    } else if (!authLoading && !user) {
      setProfileLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`hrRegistrationForm_${user.id}`, JSON.stringify(formData));
    }
  }, [formData, user?.id]);

  const fetchCompanyStatus = async () => {
    try {
      const res = await fetch(`/api/company/profile?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.registered) {
        setApprovalStatus(data.company);
        if (data.company.approvalStatus === 'approved') {
          fetchStats();
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [resStats, resApps] = await Promise.all([
        fetch('/api/company/dashboard', { cache: 'no-store' }),
        fetch('/api/company/applications', { cache: 'no-store' })
      ]);
      const dataStats = await resStats.json();
      const dataApps = await resApps.json();

      if (dataStats.success) {
        setStats(dataStats.stats);
      }
      
      if (dataApps.success && dataApps.applications) {
        console.log("Total applications returned by API:", dataApps.applications.length);
        
        // Calculate trends for the last 7 days
        const counts = Array(7).fill(0);
        const today = new Date();
        const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        
        dataApps.applications.forEach(app => {
          // Safely fallback to updatedAt or current date
          const dateString = app.createdAt || app.updatedAt || new Date().toISOString();
          const appDate = new Date(dateString);
          
          const utcApp = Date.UTC(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());
          const diffDays = Math.floor((utcToday - utcApp) / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays < 7) {
            // Index 6 is today, 0 is 6 days ago
            counts[6 - diffDays]++;
          } else if (diffDays < 0) {
            // Future dates fall into today
            counts[6]++;
          } else {
            // Older dates fall into oldest bucket (6 days ago) to ensure sum equals total
            counts[0]++;
          }
        });
        
        console.log("Chart buckets:", counts, "Sum:", counts.reduce((a,b)=>a+b,0));
        setTrendsData(counts);
      }
    } catch (error) {
      console.error('Error fetching stats or applications:', error);
    }
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/company/profile?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        if (user?.id) localStorage.removeItem(`hrRegistrationForm_${user.id}`);
        setApprovalStatus(data.company);
        alert("Company profile submitted successfully. Waiting for admin approval.");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Submission failed');
    } finally {
      setProfileLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFF]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-indigo-600 font-semibold tracking-wide">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (approvalStatus) {
    const last7DaysLabels = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const maxTrendsCount = Math.max(...trendsData, 1);

    return (
      <div className="w-full">

        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                Dashboard Overview
              </h1>
              <p className="text-slate-500 font-medium text-sm">Real-time metrics and hiring pipeline for <span className="text-[#0B1E40] font-semibold">{approvalStatus.companyName}</span></p>
            </div>
            {approvalStatus.approvalStatus === 'approved' && (
              <button onClick={() => router.push('/company/jobs')} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm">
                <span className="text-lg leading-none">+</span> Create Job Listing
              </button>
            )}
          </div>
          
          {approvalStatus.approvalStatus === 'pending' && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 p-8 rounded-3xl shadow-sm mb-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-amber-600 shadow-sm border border-amber-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Status: Pending Approval</h3>
                  <p className="text-amber-700/80 font-medium">Your company profile is under review. Please wait for admin approval.</p>
                </div>
              </div>
            </div>
          )}

          {approvalStatus.approvalStatus === 'rejected' && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-3xl shadow-sm mb-8 flex items-start gap-4">
               <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-red-600 shadow-sm border border-red-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Registration Rejected</h3>
                <p className="text-red-700/80 font-medium">Unfortunately, your company registration could not be verified. Please contact support for more details.</p>
              </div>
            </div>
          )}

          {approvalStatus.approvalStatus === 'approved' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                
                {/* Card 1 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">Live</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats.activeJobs}</p>
                  <h3 className="text-xs font-medium text-slate-500 mt-0.5">Active Jobs</h3>
                </div>
                
                {/* Card 2 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">+0%</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalApplicants}</p>
                  <h3 className="text-xs font-medium text-slate-500 mt-0.5">Total Applicants</h3>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">This Week</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats.interviews}</p>
                  <h3 className="text-xs font-medium text-slate-500 mt-0.5">Interviews</h3>
                </div>

                {/* Card 4 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">Success</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats.hired}</p>
                  <h3 className="text-xs font-medium text-slate-500 mt-0.5">Hired Candidates</h3>
                </div>

              </div>

              {/* Advanced Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Application Trends */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-800">Application Trends</h3>
                      <p className="text-sm font-medium text-slate-500">Applicant volume over the last 7 days</p>
                    </div>
                    <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-2 outline-none">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                    </select>
                  </div>
                  
                  {/* Line Chart */}
                  <div className="h-64 relative pt-4 pb-6 sm:pb-8">
                    {/* Horizontal grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 sm:pb-8">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-full border-t border-slate-100/80 h-0 flex items-center justify-start">
                           <span className="text-xs text-slate-400 font-medium -translate-y-3 w-8 text-left">{100 - i*25}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* SVG Line and Area */}
                    <div className="absolute inset-0 pb-6 sm:pb-8 pl-8">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Area Fill */}
                        <polygon 
                          points={`0,100 ${trendsData.map((count, i) => `${(i / 6) * 100},${100 - (count / Math.max(100, maxTrendsCount)) * 100}`).join(' ')} 100,100`} 
                          fill="url(#lineGradient)"
                        />
                        {/* Line */}
                        <polyline 
                          points={trendsData.map((count, i) => `${(i / 6) * 100},${100 - (count / Math.max(100, maxTrendsCount)) * 100}`).join(' ')}
                          fill="none" 
                          stroke="#4F46E5" 
                          strokeWidth="3" 
                          vectorEffect="non-scaling-stroke"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    {/* Data Points and Tooltips */}
                    <div className="absolute inset-0 pb-6 sm:pb-8 pl-8 z-10">
                      {last7DaysLabels.map((day, i) => {
                        const count = trendsData[i];
                        const xPercent = (i / 6) * 100;
                        const yPercent = 100 - (count / Math.max(100, maxTrendsCount)) * 100;
                        const isToday = i === 6;
                        return (
                          <div key={i} className="absolute group cursor-pointer" style={{ left: `${xPercent}%`, top: `${yPercent}%`, transform: 'translate(-50%, -50%)' }}>
                            {/* Circle Marker */}
                            <div className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-[2.5px] bg-white transition-transform duration-300 group-hover:scale-150 ${isToday ? 'border-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'border-indigo-500 hover:border-indigo-600'}`}></div>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                              {count} {count === 1 ? 'Applicant' : 'Applicants'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* X-Axis Labels */}
                    <div className="absolute bottom-0 left-0 w-full pl-8 h-6">
                      {last7DaysLabels.map((day, i) => {
                        const isToday = i === 6;
                        return (
                          <span key={i} className={`text-xs font-bold absolute ${isToday ? 'text-indigo-600' : 'text-slate-400'}`} style={{ left: `${(i / 6) * 100}%`, transform: 'translateX(-50%)' }}>
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Hiring Efficiency */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
                  
                  <div>
                    <h3 className="text-xl font-black text-slate-800 mb-1">Hiring Efficiency</h3>
                    <p className="text-sm font-medium text-slate-500">Candidate conversion rate</p>
                  </div>

                  {/* Circular CSS Chart */}
                  <div className="flex justify-center items-center py-8 relative">
                    <div className="relative w-40 h-40">
                      {/* Background circle */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                        {/* Progress circle (dummy 0% for now) */}
                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset="440" strokeLinecap="round" className="text-[#0B1E40] transition-all duration-1000" />
                      </svg>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <span className="text-4xl font-black text-slate-800">{stats.totalApplicants > 0 ? Math.round((stats.hired / stats.totalApplicants) * 100) : 0}%</span>
                        <span className="block text-xs font-bold text-slate-500 uppercase mt-1">Conversion</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs font-bold uppercase mb-1">Interviews</p>
                      <p className="text-slate-800 text-2xl font-black">{stats.interviews}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs font-bold uppercase mb-1">Offers</p>
                      <p className="text-slate-800 text-2xl font-black">{stats.hired}</p>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Company Registration Form
  return (
    <div className="flex items-center justify-center relative w-full pb-12">
      <div className="max-w-4xl w-full bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative z-10">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-10 py-10 text-white relative overflow-hidden flex flex-col items-start">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[50px] rounded-full"></div>
          <h2 className="text-3xl font-black tracking-tight relative z-10">HR Company Setup</h2>
          <p className="text-slate-300 mt-2 font-medium relative z-10">Complete your company profile to unlock the hiring portal</p>
        </div>
        
        <form onSubmit={handleRegistrationSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
              <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-all font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">HR Manager Name</label>
              <input required type="text" value={formData.hrName} onChange={e => setFormData({...formData, hrName: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-all font-medium" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Company Website</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                </div>
                <input type="url" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full pl-11 pr-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-all font-medium hover:border-indigo-300" placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">LinkedIn Profile <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </div>
                <input required type="url" value={formData.linkedIn} onChange={e => setFormData({...formData, linkedIn: e.target.value})} className="w-full pl-11 pr-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-all font-medium hover:border-indigo-300" placeholder="https://linkedin.com/company/..." />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Company Address</label>
            <textarea required rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-all font-medium"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-100 pt-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Industry Type</label>
              <div className="relative">
                 <select value={formData.industryType} onChange={e => setFormData({...formData, industryType: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-all font-medium appearance-none hover:border-indigo-300 cursor-pointer">
                  <option value="IT Services">IT Services</option>
                  <option value="Product Based">Product Based</option>
                  <option value="Fintech">Fintech</option>
                  <option value="EdTech">EdTech</option>
                  <option value="Healthcare">Healthcare</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Company Size</label>
              <div className="relative">
                <select value={formData.companySize} onChange={e => setFormData({...formData, companySize: e.target.value})} className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-all font-medium appearance-none hover:border-indigo-300 cursor-pointer">
                  <option value="1-50">1-50 Employees</option>
                  <option value="51-200">51-200 Employees</option>
                  <option value="201-500">201-500 Employees</option>
                  <option value="500+">500+ Employees</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">DPIIT Registered?</label>
              <div className="flex items-center gap-4">
                <label className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-300 font-bold ${formData.dpiitRegistered === 'Yes' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-200' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'}`}>
                  <input type="radio" name="dpiit" value="Yes" className="hidden" checked={formData.dpiitRegistered === 'Yes'} onChange={e => setFormData({...formData, dpiitRegistered: e.target.value})} />
                  Yes
                </label>
                <label className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-300 font-bold ${formData.dpiitRegistered === 'No' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-200' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'}`}>
                  <input type="radio" name="dpiit" value="No" className="hidden" checked={formData.dpiitRegistered === 'No'} onChange={e => setFormData({...formData, dpiitRegistered: e.target.value})} />
                  No
                </label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={profileLoading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all mt-4 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">
            {profileLoading ? 'Submitting...' : 'Submit Registration for Approval'}
          </button>
        </form>
      </div>
    </div>
  );
}
