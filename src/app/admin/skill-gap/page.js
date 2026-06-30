'use client';

import { useState, useEffect } from 'react';

export default function AdminSkillGapAnalysis() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchSkillGapData();
  }, []);

  const fetchSkillGapData = async () => {
    try {
      const res = await fetch('/api/admin/skill-gap');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Failed to load Skill Gap Analysis.</div>;
  }

  const { strongestDomains, weakestDomains, averageSkillGap, mostCommonWeakTopics, improvementList } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Global Skill Gap Analysis</h1>
        <p className="text-slate-500 mt-1">Identify systemic weaknesses and candidates needing intervention.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Most Common Weak Topics */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-1">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-red-500 rounded-full"></span>
            Most Common Weak Topics
          </h3>
          <ul className="space-y-4">
            {mostCommonWeakTopics.map((topic, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">{topic.topic}</span>
                <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">
                  {topic.failures} failures
                </span>
              </li>
            ))}
            {mostCommonWeakTopics.length === 0 && <p className="text-sm text-slate-500">No weak topics found.</p>}
          </ul>
        </div>

        {/* Domain Performance */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                Strongest Domains
              </h3>
              <ul className="space-y-3">
                {strongestDomains.map((d, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">{d.domain}</span>
                    <span className="text-sm font-bold text-emerald-600">{d.score}% Avg</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                Weakest Domains
              </h3>
              <ul className="space-y-3">
                {weakestDomains.map((d, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">{d.domain}</span>
                    <span className="text-sm font-bold text-orange-600">{d.score}% Avg</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Average Skill Gap */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Average Skill Gap by Domain</h3>
             <p className="text-xs text-slate-500 mb-4">Calculated as 100% minus the average domain score.</p>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {averageSkillGap.map((d, idx) => (
                 <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                   <p className="text-xs text-slate-600 font-medium truncate" title={d.domain}>{d.domain}</p>
                   <p className={`text-xl font-black mt-1 ${d.gap > 50 ? 'text-red-600' : d.gap > 30 ? 'text-orange-500' : 'text-emerald-500'}`}>
                     {d.gap}% Gap
                   </p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Candidates Needing Improvement Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800">Candidates Needing Improvement (&lt;50% Score)</h2>
          <p className="text-xs text-slate-500 mt-1">These candidates are classified as Beginners and need immediate intervention.</p>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-white shadow-xs">
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Assessment Date</th>
              </tr>
            </thead>
            <tbody>
              {improvementList.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">No candidates currently need improvement!</td></tr>
              ) : (
                improvementList.map((c, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.domain}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">{c.score}%</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(c.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
