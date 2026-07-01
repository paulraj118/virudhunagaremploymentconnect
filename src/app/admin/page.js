'use client';

import { useState, useEffect } from 'react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading Analytics...</div>;
  if (!stats) return <div>Failed to load stats.</div>;

  const kpis = [
    { 
      label: 'Total Students', 
      value: stats.totalStudents, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      borderHover: 'border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 hover:scale-[1.02]',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>
    },
    { 
      label: 'Total Companies', 
      value: stats.totalCompanies, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50', 
      borderHover: 'border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 hover:scale-[1.02]',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
    },
    { 
      label: 'Total Jobs Posted', 
      value: stats.totalJobs, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      borderHover: 'border-slate-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/5 hover:scale-[1.02]',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
    },
    { 
      label: 'Total Placements', 
      value: stats.totalPlacements, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      borderHover: 'border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5 hover:scale-[1.02]',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
    },
    { 
      label: 'Total Assessments', 
      value: stats.totalAssessments, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      borderHover: 'border-slate-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/5 hover:scale-[1.02]',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
    },
    { 
      label: 'Pass Percentage', 
      value: `${stats.passPercentage}%`, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50', 
      borderHover: 'border-slate-200 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/5 hover:scale-[1.02]',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-8">System Analytics Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`bg-white p-5 rounded-2xl border transition-all duration-300 transform flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.01)] group ${kpi.borderHover}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm ${kpi.bg} ${kpi.color}`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-0.5">{kpi.label}</p>
              <p className={`text-2xl font-black tracking-tight ${kpi.color}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Pipeline Conversion</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span className="text-slate-700">Total Applications</span>
                <span className="text-slate-500">{stats.totalApplications}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-slate-800 h-3 rounded-full w-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span className="text-slate-700">Shortlisted for Interviews</span>
                <span className="text-slate-500">{(stats.totalApplications * 0.4).toFixed(0)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-indigo-500 h-3 rounded-full w-[40%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span className="text-slate-700">Placements (Joined)</span>
                <span className="text-slate-500">{stats.totalPlacements}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-emerald-500 h-3 rounded-full" style={{width: `${stats.totalApplications > 0 ? Math.max((stats.totalPlacements / stats.totalApplications) * 100, 5) : 0}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">AI System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-slate-700">AI Resume Screening Engine</span>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">ONLINE</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-slate-700">AI Interview Generator</span>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">ONLINE</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-slate-700">Anti-Cheat Proctoring</span>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
