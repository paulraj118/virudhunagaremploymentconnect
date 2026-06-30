'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuestionBankPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  // Modals
  const [showPreview, setShowPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, [category, type, status]); // Re-fetch on filter change

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Stats
      const statsRes = await fetch('/api/company/question-bank/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Fetch Questions
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (type) queryParams.append('type', type);
      if (status) queryParams.append('status', status);

      const qRes = await fetch(`/api/company/question-bank?${queryParams}`);
      const qData = await qRes.json();
      if (qData.success) setQuestions(qData.questions);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/company/question-bank/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Update status failed', err);
    }
  };

  const softDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/company/question-bank/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: true })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Question Bank</h1>
          <p className="text-slate-500 text-sm font-medium">Manage, search, and approve technical questions</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors">
            Bulk Import
          </button>
          <button className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition-colors">
            + Add Question
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-xs font-bold text-slate-500 mb-1">TOTAL</p>
            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm text-center">
            <p className="text-xs font-bold text-emerald-600 mb-1">APPROVED</p>
            <p className="text-2xl font-black text-emerald-700">{stats.approved}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm text-center">
            <p className="text-xs font-bold text-amber-600 mb-1">PENDING REVIEW</p>
            <p className="text-2xl font-black text-amber-700">{stats.pending}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-xs font-bold text-slate-500 mb-1">ARCHIVED</p>
            <p className="text-2xl font-black text-slate-700">{stats.archived}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-sm text-center">
            <p className="text-xs font-bold text-indigo-600 mb-1">AI GENERATED</p>
            <p className="text-2xl font-black text-indigo-700">{stats.aiGenerated}</p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <input 
            type="text" 
            placeholder="Search by keywords, tags, or content..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </form>

        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full md:w-auto px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50">
          <option value="">All Types</option>
          <option value="MCQ">Multiple Choice</option>
          <option value="FILL_BLANK">Fill in Blanks</option>
          <option value="PROGRAMMING">Programming</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full md:w-auto px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50">
          <option value="">All Statuses</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Approved">Approved</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No questions found matching your criteria.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Question Details</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Type & Tags</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.map((q) => (
                <tr key={q._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 line-clamp-1">
                      {q.type === 'PROGRAMMING' ? q.content.title : q.content.questionText}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Role: {q.jobRole} | By: {q.isAiGenerated ? 'AI' : 'HR'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[10px] font-bold mr-2">
                      {q.type.replace('_', ' ')}
                    </span>
                    {q.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-[10px] font-bold mr-1">{tag}</span>
                    ))}
                    {q.tags?.length > 2 && <span className="text-xs text-slate-400">+{q.tags.length - 2}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      q.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      q.status === 'Pending Review' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setShowPreview(q)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs mr-3">Preview</button>
                    {q.status === 'Pending Review' && (
                      <button onClick={() => updateStatus(q._id, 'Approved')} className="text-emerald-600 hover:text-emerald-800 font-bold text-xs mr-3">Approve</button>
                    )}
                    {q.status === 'Approved' && (
                      <button onClick={() => updateStatus(q._id, 'Archived')} className="text-slate-600 hover:text-slate-800 font-bold text-xs mr-3">Archive</button>
                    )}
                    <button onClick={() => softDelete(q._id)} className="text-red-500 hover:text-red-700 font-bold text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800">Question Preview</h3>
                <p className="text-xs text-slate-500 font-medium">Exactly as candidates will see it</p>
              </div>
              <button onClick={() => setShowPreview(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {showPreview.type === 'MCQ' && (
                <div>
                  <p className="font-bold text-slate-800 text-lg mb-4">{showPreview.content.questionText}</p>
                  <div className="space-y-3">
                    {showPreview.content.options.map((opt, i) => (
                      <div key={i} className={`p-4 border rounded-xl flex items-center gap-3 ${showPreview.content.correctAnswer === ['A','B','C','D'][i] || showPreview.content.correctOption === ['A','B','C','D'][i] ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
                        <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">
                          {['A','B','C','D'][i]}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{opt}</span>
                        {(showPreview.content.correctAnswer === ['A','B','C','D'][i] || showPreview.content.correctOption === ['A','B','C','D'][i]) && (
                          <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">Correct Answer</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-800 mb-1">Explanation</p>
                    <p className="text-sm text-indigo-700">{showPreview.content.explanation}</p>
                  </div>
                </div>
              )}

              {showPreview.type === 'PROGRAMMING' && (
                <div>
                  <h4 className="font-black text-xl text-slate-800 mb-4">{showPreview.content.title}</h4>
                  <div className="prose prose-sm text-slate-600 mb-6 max-w-none">
                    <p>{showPreview.content.description || showPreview.content.problemStatement}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 mb-2">Input Format</p>
                      <p className="text-sm font-mono">{showPreview.content.inputFormat}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 mb-2">Output Format</p>
                      <p className="text-sm font-mono">{showPreview.content.outputFormat}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                    <p className="text-xs font-bold text-slate-500 mb-2">Constraints</p>
                    <p className="text-sm font-mono text-indigo-600">{showPreview.content.constraints}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-2">Sample Input</p>
                      <pre className="bg-slate-800 text-slate-300 p-3 rounded-lg text-xs overflow-x-auto">
                        {showPreview.content.sampleInput}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-2">Sample Output</p>
                      <pre className="bg-slate-800 text-slate-300 p-3 rounded-lg text-xs overflow-x-auto">
                        {showPreview.content.sampleOutput}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <p className="text-xs font-bold text-slate-500 mb-3">Hidden Test Cases ({showPreview.content.hiddenTestCases?.length || 0})</p>
                    <div className="space-y-2">
                      {showPreview.content.hiddenTestCases?.map((tc, i) => (
                        <div key={i} className="flex gap-2 text-xs font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-400">TC{i+1}:</span>
                          <span className="truncate flex-1" title={tc.input}>In: {tc.input}</span>
                          <span className="text-slate-300">|</span>
                          <span className="truncate flex-1 text-emerald-600" title={tc.expectedOutput}>Out: {tc.expectedOutput}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowPreview(null)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
