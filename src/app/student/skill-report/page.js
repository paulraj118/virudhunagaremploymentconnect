'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StudentSkillReport() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/student/skill-report');
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      } else {
        setError(data.message || 'Failed to load report.');
      }
    } catch (err) {
      setError('An error occurred while fetching your report.');
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

  if (error || !report) {
    return (
      <div className="p-8 text-center max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2">No Skill Report Available</h2>
          <p className="mb-4">{error || "You haven't completed a self-assessment yet."}</p>
          <Link href="/student/self-assessment" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded font-medium hover:bg-indigo-700">
            Take Assessment
          </Link>
        </div>
      </div>
    );
  }

  const { score, readinessLevel, domain, strongTopics, weakTopics, difficultyPerformance, roadmap, recommendations } = report;

  const getBadgeColor = (level) => {
    switch (level) {
      case 'Job Ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Advanced': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Skill Report</h1>
          <p className="text-slate-500 mt-1">Domain: <span className="font-semibold text-slate-700">{domain}</span></p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-500 font-medium">Overall Score</p>
            <p className="text-3xl font-black text-indigo-600">{score}%</p>
          </div>
          <div className="h-12 w-px bg-slate-200"></div>
          <div className="text-right">
            <p className="text-sm text-slate-500 font-medium mb-1">Readiness Level</p>
            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getBadgeColor(readinessLevel)}`}>
              {readinessLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths and Weaknesses */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              Strong Topics
            </h3>
            {strongTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {strongTopics.map((t, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Not enough data to determine strong topics yet.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-red-500 rounded-full"></span>
              Weak Topics (Skill Gaps)
            </h3>
            {weakTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((t, idx) => (
                  <span key={idx} className="bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Great job! No significant weak topics detected.</p>
            )}
          </div>
        </div>

        {/* Difficulty Performance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
            Performance by Difficulty
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-600">Easy</span>
                <span className="text-slate-800">{difficultyPerformance.Easy}% Correct</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${difficultyPerformance.Easy}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-600">Medium</span>
                <span className="text-slate-800">{difficultyPerformance.Medium}% Correct</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${difficultyPerformance.Medium}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-600">Hard</span>
                <span className="text-slate-800">{difficultyPerformance.Hard}% Correct</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${difficultyPerformance.Hard}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Learning Roadmap */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Personalized Learning Roadmap</h3>
        <p className="text-slate-500 text-sm mb-6">Generated automatically based on your weakest topics and skill gaps.</p>
        
        <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 py-4">
          {roadmap.map((step, idx) => (
            <div key={idx} className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-50"></span>
              <h4 className="font-bold text-slate-800">Week {step.week}: {step.title}</h4>
              <ul className="mt-2 space-y-2">
                {step.tasks.map((task, tIdx) => (
                  <li key={tIdx} className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-900 mb-4">System Recommendations</h3>
        <ul className="space-y-3">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex gap-3 text-indigo-800 text-sm">
              <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
