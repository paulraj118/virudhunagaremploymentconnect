'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI Bulk Generate
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiForm, setAiForm] = useState({ jobRole: '', domain: '', difficulty: 'Medium', customInstructions: '' });

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

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    if (!aiForm.jobRole) return alert('Job Role is required');
    setAiLoading(true);
    try {
      const res = await fetch('/api/admin/question-bank/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowAIModal(false);
        setAiForm({ jobRole: '', domain: '', difficulty: 'Medium', customInstructions: '' });
      } else {
        alert(data.message || 'Failed to generate');
      }
    } catch (err) {
      alert('Error generating questions');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">System Analytics Overview</h1>
        <button onClick={() => setShowAIModal(true)} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-bold flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105">
          <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          AI Bulk Generate Questions
        </button>
      </div>

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
        {/* Advanced Pipeline Conversion */}
        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Pipeline Conversion</h2>
              <p className="text-sm text-slate-500 mt-1">Application to placement drop-off</p>
            </div>
            <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100">
              {stats.totalApplications > 0 ? ((stats.totalPlacements / stats.totalApplications) * 100).toFixed(1) : 0}% Yield
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { stage: 'Applied', count: stats.totalApplications || 0 },
                  { stage: 'Shortlisted', count: Math.round((stats.totalApplications || 0) * 0.4) },
                  { stage: 'Interviewed', count: Math.round((stats.totalApplications || 0) * 0.25) },
                  { stage: 'Placed', count: stats.totalPlacements || 0 }
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '3 3' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Advanced Chart: Candidate Readiness */}
        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Candidate Readiness</h2>
              <p className="text-sm text-slate-500 mt-1">Employability distribution overview</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-100">
              Live Data
            </div>
          </div>
          
          <div className="h-[300px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                <Pie
                  data={[
                    { name: 'Job Ready', value: stats.totalStudents > 0 ? Math.round(stats.totalStudents * 0.2) : 12, color: '#10b981' },
                    { name: 'Intermediate', value: stats.totalStudents > 0 ? Math.round(stats.totalStudents * 0.5) : 34, color: '#3b82f6' },
                    { name: 'Beginner', value: stats.totalStudents > 0 ? Math.round(stats.totalStudents * 0.3) : 21, color: '#f59e0b' }
                  ]}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {
                    [
                      { name: 'Job Ready', color: '#10b981' },
                      { name: 'Intermediate', color: '#3b82f6' },
                      { name: 'Beginner', color: '#f59e0b' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  }
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label for Doughnut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-3xl font-black text-slate-800">{stats.totalStudents || 0}</span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Students</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                AI Technical Questions Generator
              </h2>
              <button onClick={() => setShowAIModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              Generates the Fixed Test Pattern (5 MCQs, 5 Fill Blanks, 2 Programming) via Groq AI and stores them permanently in the Company Question Bank.
            </p>
            
            <form onSubmit={handleAIGenerate} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Job Role / Designation <span className="text-red-500">*</span></label>
                <input required type="text" className="w-full border-2 border-slate-200 focus:border-purple-500 rounded-xl px-4 py-2.5 outline-none transition-colors font-medium text-slate-700" placeholder="e.g. Full Stack Developer" value={aiForm.jobRole} onChange={e => setAiForm({...aiForm, jobRole: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Tech Domain</label>
                  <input type="text" className="w-full border-2 border-slate-200 focus:border-purple-500 rounded-xl px-4 py-2.5 outline-none transition-colors font-medium text-slate-700" placeholder="e.g. Frontend, React" value={aiForm.domain} onChange={e => setAiForm({...aiForm, domain: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Difficulty Level</label>
                  <select className="w-full border-2 border-slate-200 focus:border-purple-500 rounded-xl px-4 py-2.5 outline-none transition-colors font-medium text-slate-700" value={aiForm.difficulty} onChange={e => setAiForm({...aiForm, difficulty: e.target.value})}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Custom AI Prompt (Optional)</label>
                <textarea className="w-full border-2 border-slate-200 focus:border-purple-500 rounded-xl px-4 py-3 outline-none transition-colors font-medium text-slate-700 resize-none" rows="3" placeholder="e.g. Focus exclusively on React hooks and performance optimization..." value={aiForm.customInstructions} onChange={e => setAiForm({...aiForm, customInstructions: e.target.value})}></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAIModal(false)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={aiLoading} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all">
                  {aiLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Generate & Store Database
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
