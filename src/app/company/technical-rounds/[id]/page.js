'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function TechnicalTestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  const fetchTestDetails = async () => {
    try {
      const res = await fetch(`/api/company/technical-tests/${id}`);
      const data = await res.json();
      if (data.success) {
        setTest(data.data.test);
      } else {
        setError(data.message || 'Failed to fetch test details');
      }
    } catch (err) {
      setError('Server error while fetching details');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publishing this test makes it available for candidates and locks editing. Continue?')) return;
    try {
      const res = await fetch(`/api/company/technical-tests/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchTestDetails(); // Refresh
      } else {
        alert(data.errors ? data.errors.join('\n') : data.message);
      }
    } catch (err) {
      alert('Server error while publishing');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !test) return (
    <div className="bg-red-50 text-red-600 p-8 rounded-2xl text-center max-w-2xl mx-auto mt-10 font-medium">
      {error || 'Test not found'}
      <button onClick={() => router.push('/company/technical-rounds')} className="block mt-4 text-sm text-red-800 underline mx-auto">Back to Technical Rounds</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/company/technical-rounds')} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-800">{test.jobRole}</h1>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${
                test.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                test.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {test.status}
              </span>
            </div>
            {test.jobId && <p className="text-slate-500 text-sm font-medium">For Job: {test.jobId.title || test.jobId.role}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {test.status === 'Draft' && (
            <>
              <button
                onClick={() => router.push(`/company/technical-rounds/${id}/edit`)}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition-colors border border-indigo-200"
              >
                Edit Draft
              </button>
              <button
                onClick={handlePublish}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5"
              >
                Publish Test
              </button>
            </>
          )}
          {test.status === 'Published' && (
            <>
              <button
                onClick={() => router.push(`/company/technical-rounds/${id}/assign`)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5"
              >
                Assign Candidates
              </button>
              <button
                onClick={() => router.push(`/company/technical-rounds/${id}/results`)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5"
              >
                View Results
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</p>
          <p className="text-xl font-black text-slate-800">{test.duration} <span className="text-sm font-medium text-slate-500">mins</span></p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total / Pass Marks</p>
          <p className="text-xl font-black text-slate-800">{test.totalMarks} <span className="text-sm font-medium text-slate-500">/ {test.passingMarks}</span></p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Assigned</p>
          <p className="text-xl font-black text-indigo-700">{test.assignedCandidateCount || 0}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Completed</p>
          <p className="text-xl font-black text-emerald-700">{test.completedCandidateCount || 0}</p>
        </div>
      </div>

      {/* Questions Preview */}
      <div className="space-y-6">
        <h2 className="text-lg font-black text-slate-800 border-b border-slate-200 pb-2">Test Content Overview</h2>

        {/* Section A */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Section A: Multiple Choice ({test.sections?.sectionA_MCQ?.length || 0} Questions)</h3>
          <div className="space-y-3">
            {test.sections?.sectionA_MCQ?.map((q, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium text-slate-700 mb-1"><span className="text-slate-400">Q{i + 1}.</span> {q.question}</p>
                <div className="grid grid-cols-2 gap-2 pl-5">
                  {q.options?.map((opt, j) => (
                    <div key={j} className={`text-xs p-1.5 rounded ${q.correctOption === ['A','B','C','D'][j] ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500'}`}>
                      {['A','B','C','D'][j]}. {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section B */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Section B: Fill in the Blanks ({test.sections?.sectionB_FillBlanks?.length || 0} Questions)</h3>
          <div className="space-y-3">
            {test.sections?.sectionB_FillBlanks?.map((q, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium text-slate-700 mb-1"><span className="text-slate-400">Q{i + 1}.</span> {q.question}</p>
                <p className="text-xs font-bold text-emerald-600 pl-5">Ans: {q.correctAnswer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section C & D */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: 'C', data: test.sections?.sectionC_Programming1 },
            { label: 'D', data: test.sections?.sectionD_Programming2 }
          ].map((prog, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <h3 className="font-bold text-slate-800 mb-3">Section {prog.label}: Programming</h3>
              {prog.data ? (
                <div className="flex-1">
                  <p className="text-sm font-bold text-indigo-700 mb-2">{prog.data.title}</p>
                  <p className="text-xs text-slate-600 mb-4 line-clamp-3">{prog.data.description}</p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-mono text-slate-600 mb-4">
                    <p className="font-bold text-slate-400 uppercase tracking-wider mb-1 text-[10px]">Sample I/O</p>
                    <p>In: {prog.data.sampleInput}</p>
                    <p>Out: {prog.data.sampleOutput}</p>
                  </div>
                  <div className="mt-auto">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      {prog.data.hiddenTestCases?.length || 0} Hidden Test Cases
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Not configured</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
