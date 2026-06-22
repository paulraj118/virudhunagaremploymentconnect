'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CompanyDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState(null); // null means not registered
  const [stats, setStats] = useState({ activeJobs: 0, totalApplicants: 0, interviews: 0, hired: 0 });

  useEffect(() => {
    fetchCompanyStatus();
  }, []);

  const fetchCompanyStatus = async () => {
    try {
      const res = await fetch('/api/company/profile', { cache: 'no-store' });
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
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/company/dashboard', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
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
    return (
      <div className="min-h-screen bg-white font-sans">

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                Dashboard Overview
              </h1>
              <p className="text-slate-500 font-medium text-sm">Real-time metrics and hiring pipeline for <span className="text-[#0B1E40] font-semibold">{approvalStatus.companyName}</span></p>
            </div>
            {approvalStatus.approvalStatus === 'approved' && (
              <button onClick={() => router.push('/company/jobs')} className="bg-[#0B1E40] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#152d54] transition-colors flex items-center gap-2 text-sm">
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
                  <h3 className="font-bold text-xl mb-1">Registration Under Review</h3>
                  <p className="text-amber-700/80 font-medium">Your company profile ({approvalStatus.companyName}) is currently being verified by our Admin team. Once approved, you will unlock full access to post jobs and view applicant profiles.</p>
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
                  
                  {/* Custom CSS Bar Chart */}
                  <div className="h-64 flex items-end justify-between gap-2 pt-4 relative">
                    {/* Horizontal grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-full border-t border-slate-100/80 h-0 flex items-center justify-start">
                           <span className="text-xs text-slate-400 font-medium -translate-y-3">{100 - i*25}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Bars */}
                    <div className="w-full flex justify-around items-end h-full z-10 pl-8">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                        // Dummy heights for demonstration
                        const heights = ['h-[20%]', 'h-[40%]', 'h-[30%]', 'h-[60%]', 'h-[80%]', 'h-[50%]', 'h-[90%]'];
                        const isToday = i === 6;
                        return (
                          <div key={day} className="flex flex-col items-center gap-3 group w-full px-1 sm:px-2 relative">
                            <div className={`w-full max-w-[3rem] ${heights[i]} rounded-t-lg transition-all duration-500 relative group-hover:opacity-80 ${isToday ? 'bg-gradient-to-t from-indigo-600 to-purple-500 shadow-lg shadow-indigo-500/30' : 'bg-indigo-100'}`}>
                              {/* Tooltip on hover */}
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                                0 Applicants
                              </div>
                            </div>
                            <span className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</span>
                          </div>
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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFF]">
      <div className="flex flex-col items-center gap-4 text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Welcome to HR Portal</h2>
        <p className="text-slate-600">Please complete your company setup to view the dashboard.</p>
        <button onClick={() => router.push('/company/setup')} className="mt-4 bg-[#0B1E40] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#152d54] transition-colors">
          Go to Company Setup
        </button>
      </div>
    </div>
  );
}
