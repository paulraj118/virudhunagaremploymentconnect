'use client';

import { useState, useEffect } from 'react';
import CandidateRankingTable from '@/components/CandidateRankingTable';
import CollegeAssessmentReports from '@/components/CollegeAssessmentReports';
import { useRouter } from 'next/navigation';

export default function CollegeDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/college/dashboard');
      if (res.status === 401) {
        router.push('/college/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }); // Wait, college auth might just use standard logout or clear cookie
    // Since we use the same `token` cookie, standard logout API should work, or we can just delete it client side.
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


      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 font-medium">Registered Students</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats?.totalRegistered || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 font-medium">Assessed Students</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats?.completedAssessment || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 font-medium">Avg Assessment Score</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.avgAssessmentScore || 0}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 font-medium">Avg Employability</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats?.avgEmployabilityScore || 0}/100</p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-sm text-emerald-700 font-medium">Job Ready</p>
            <p className="text-2xl font-black text-emerald-800 mt-1">{stats?.jobReady || 0}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-700 font-medium">Advanced</p>
            <p className="text-2xl font-black text-blue-800 mt-1">{stats?.advanced || 0}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
            <p className="text-sm text-yellow-700 font-medium">Intermediate</p>
            <p className="text-2xl font-black text-yellow-800 mt-1">{stats?.intermediate || 0}</p>
          </div>
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-700 font-medium">Beginner</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats?.beginner || 0}</p>
          </div>
        </div>

        {/* Candidate Ranking Section */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            Candidate Ranking & Shortlisting
          </h2>
          <CandidateRankingTable role="college" />
        </div>

        {/* Assessment Reports Section */}
        <CollegeAssessmentReports />

      </main>
    </div>
  );
}
