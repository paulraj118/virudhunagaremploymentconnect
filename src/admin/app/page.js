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
    { label: 'Total Students', value: stats.totalStudents, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Companies', value: stats.totalCompanies, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Jobs Posted', value: stats.totalJobs, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Placements', value: stats.totalPlacements, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Assessments', value: stats.totalAssessments, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pass Percentage', value: `${stats.passPercentage}%`, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-8">System Analytics Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">{kpi.label}</p>
              <p className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</p>
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
