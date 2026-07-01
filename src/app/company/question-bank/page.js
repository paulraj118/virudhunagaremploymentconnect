'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const DOMAINS = [
  'Python', 'Java', 'JavaScript', 'React', 'Node.js', 'SQL', 'MongoDB',
  'C', 'C++', 'HTML', 'CSS', 'Data Structures', 'Machine Learning',
  'Data Science', 'Power BI', 'R Programming', 'AWS', 'Azure',
  'Docker', 'Kubernetes', 'Cyber Security', 'Flutter', 'Android'
];

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
  const [domain, setDomain] = useState('');
  const [source, setSource] = useState('');

  // Modals
  const [showPreview, setShowPreview] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Generate Form State
  const [genDomain, setGenDomain] = useState('');
  const [genTopic, setGenTopic] = useState('');
  const [genCount, setGenCount] = useState(20);
  const [genTypes, setGenTypes] = useState(['MCQ', 'FILL_BLANK', 'PROGRAMMING']);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [category, type, status, domain, source]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/company/question-bank/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (type) queryParams.append('type', type);
      if (status) queryParams.append('status', status);
      if (domain) queryParams.append('domain', domain);
      if (source) queryParams.append('source', source);

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

  // Bulk Approve all pending
  const bulkApprove = async () => {
    if (!confirm('Approve all Pending Review questions?')) return;
    const pendingQuestions = questions.filter(q => q.status === 'Pending Review');
    for (const q of pendingQuestions) {
      await updateStatus(q._id, 'Approved');
    }
    fetchData();
  };

  // Generate Questions
  const handleGenerate = async () => {
    if (!genDomain) return alert('Please select a domain');
    if (genTypes.length === 0) return alert('Please select at least one question type');

    setGenerating(true);
    setGenResult(null);

    try {
      const res = await fetch('/api/company/question-bank/generate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: genDomain,
          topic: genTopic,
          questionCount: genCount,
          questionTypes: genTypes
        })
      });

      const data = await res.json();
      if (data.success) {
        setGenResult(data.summary);
        fetchData();
      } else {
        setGenResult({ error: data.message });
      }
    } catch (err) {
      setGenResult({ error: 'Generation failed: ' + err.message });
    } finally {
      setGenerating(false);
    }
  };

  // Toggle question type checkbox
  const toggleGenType = (t) => {
    setGenTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  // Handle Import
  const handleImport = async () => {
    if (!importFile) return alert('Please select a file');
    setImporting(true);
    setImportResult(null);

    try {
      let res;
      if (importFile.name.endsWith('.json')) {
        const text = await importFile.text();
        const json = JSON.parse(text);
        res = await fetch('/api/company/question-bank/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
      } else {
        const formData = new FormData();
        formData.append('file', importFile);
        res = await fetch('/api/company/question-bank/import', {
          method: 'POST',
          body: formData
        });
      }

      const data = await res.json();
      if (data.success) {
        setImportResult(data.summary);
        fetchData();
      } else {
        setImportResult({ error: data.message });
      }
    } catch (err) {
      setImportResult({ error: 'Import failed: ' + err.message });
    } finally {
      setImporting(false);
    }
  };

  // Handle Export
  const handleExport = async (format) => {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    if (domain) queryParams.append('domain', domain);
    if (type) queryParams.append('type', type);
    if (status) queryParams.append('status', status);
    if (source) queryParams.append('source', source);

    window.open(`/api/company/question-bank/export?${queryParams}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Question Bank</h1>
          <p className="text-slate-500 text-sm font-medium">Manage, generate, and approve technical questions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setShowGenerateModal(true); setGenResult(null); }}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Generate & Save
          </button>
          <button
            onClick={() => { setShowImportModal(true); setImportResult(null); setImportFile(null); }}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors"
          >
            Import
          </button>
          <div className="relative group">
            <button className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">
              Export ▾
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl hidden group-hover:block z-20 min-w-[120px]">
              <button onClick={() => handleExport('csv')} className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-t-xl">CSV</button>
              <button onClick={() => handleExport('json')} className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">JSON</button>
              <button onClick={() => handleExport('pdf')} className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-b-xl">PDF / Print</button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-xs font-bold text-slate-500 mb-1">TOTAL</p>
            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm text-center">
            <p className="text-xs font-bold text-emerald-600 mb-1">APPROVED</p>
            <p className="text-2xl font-black text-emerald-700">{stats.approved}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm text-center">
            <p className="text-xs font-bold text-amber-600 mb-1">PENDING</p>
            <p className="text-2xl font-black text-amber-700">{stats.pending}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-xs font-bold text-slate-500 mb-1">ARCHIVED</p>
            <p className="text-2xl font-black text-slate-700">{stats.archived}</p>
          </div>
          <div className="bg-violet-50 p-4 rounded-2xl border border-violet-100 shadow-sm text-center">
            <p className="text-xs font-bold text-violet-600 mb-1">AI GENERATED</p>
            <p className="text-2xl font-black text-violet-700">{stats.aiGenerated}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm text-center">
            <p className="text-xs font-bold text-blue-600 mb-1">MANUAL</p>
            <p className="text-2xl font-black text-blue-700">{stats.manual}</p>
          </div>
        </div>
      )}

      {/* Domain Breakdown */}
      {stats?.byDomain && stats.byDomain.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Questions by Domain</p>
          <div className="flex flex-wrap gap-2">
            {stats.byDomain.map(d => (
              <button
                key={d._id}
                onClick={() => setDomain(domain === d._id ? '' : d._id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  domain === d._id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d._id} <span className="opacity-70">({d.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-center">
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

        <select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50">
          <option value="">All Domains</option>
          {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50">
          <option value="">All Types</option>
          <option value="MCQ">Multiple Choice</option>
          <option value="FILL_BLANK">Fill in Blanks</option>
          <option value="PROGRAMMING">Programming</option>
        </select>

        <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50">
          <option value="">All Sources</option>
          <option value="AI">AI Generated</option>
          <option value="Manual">Manual</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50">
          <option value="">All Statuses</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Approved">Approved</option>
          <option value="Archived">Archived</option>
        </select>

        {stats?.pending > 0 && (
          <button onClick={bulkApprove} className="px-3 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs hover:bg-emerald-200 transition-colors whitespace-nowrap">
            ✓ Approve All Pending
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No questions found matching your criteria.</div>
        ) : (
          <>
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <p className="text-xs font-bold text-slate-500">{questions.length} questions found</p>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Question Details</th>
                  <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Type & Domain</th>
                  <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 line-clamp-1">
                        {q.type === 'PROGRAMMING' ? q.content?.title : q.content?.questionText}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {q.domain && <span className="mr-2">📁 {q.domain}</span>}
                        {q.topic && <span className="mr-2">📌 {q.topic}</span>}
                        By: {q.isAiGenerated || q.source === 'AI' ? '🤖 AI' : '👤 HR'}
                        {q.usageCount > 0 && <span className="ml-2">Used: {q.usageCount}x</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[10px] font-bold mr-2">
                        {q.type?.replace('_', ' ')}
                      </span>
                      {q.domain && (
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-[10px] font-bold">{q.domain}</span>
                      )}
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
          </>
        )}
      </div>

      {/* =================== GENERATE MODAL =================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">⚡ Generate & Save Question Bank</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">AI-powered question generation using Gemini</p>
                </div>
                <button onClick={() => setShowGenerateModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Domain */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Domain *</label>
                <select value={genDomain} onChange={(e) => setGenDomain(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50">
                  <option value="">Select Domain</option>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Topic (Optional)</label>
                <input type="text" value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="e.g., Loops, OOP, Arrays..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Number of Questions</label>
                <div className="flex gap-2">
                  {[10, 20, 50, 100, 200].map(n => (
                    <button key={n} onClick={() => setGenCount(n)} className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold transition-all ${genCount === n ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Question Types</label>
                <div className="flex gap-3">
                  {[
                    { key: 'MCQ', label: 'MCQ' },
                    { key: 'FILL_BLANK', label: 'Fill in Blank' },
                    { key: 'PROGRAMMING', label: 'Programming' }
                  ].map(t => (
                    <label key={t.key} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${genTypes.includes(t.key) ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                      <input type="checkbox" checked={genTypes.includes(t.key)} onChange={() => toggleGenType(t.key)} className="accent-indigo-600" />
                      <span className="text-sm font-bold">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Live Progress */}
              {generating && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-5 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-indigo-700">Generating questions...</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-indigo-600 font-medium">Domain: <span className="font-bold">{genDomain}</span></p>
                    <p className="text-xs text-indigo-600 font-medium">Requested: <span className="font-bold">{genCount}</span> questions</p>
                    <p className="text-xs text-indigo-600 font-medium">Processing in batches of 20...</p>
                    <div className="w-full bg-indigo-200 rounded-full h-2 mt-2">
                      <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Result Summary */}
              {genResult && !genResult.error && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-sm font-black text-emerald-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Generation Complete!
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-black text-emerald-700">{genResult.generated}</p>
                      <p className="text-[10px] font-bold text-emerald-600">Generated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-emerald-700">{genResult.saved}</p>
                      <p className="text-[10px] font-bold text-emerald-600">Saved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-amber-600">{genResult.duplicatesSkipped}</p>
                      <p className="text-[10px] font-bold text-amber-500">Duplicates</p>
                    </div>
                  </div>
                  {genResult.failed > 0 && (
                    <p className="text-xs text-red-600 font-bold mt-2 text-center">Failed: {genResult.failed}</p>
                  )}
                  <p className="text-xs text-slate-500 font-medium mt-2 text-center">Time: {genResult.timeTakenFormatted}</p>
                </div>
              )}

              {genResult?.error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm font-bold text-red-700">❌ {genResult.error}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                Close
              </button>
              {!generating && (
                <button onClick={handleGenerate} disabled={!genDomain || genTypes.length === 0} className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-sm hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                  ⚡ Generate {genCount} Questions
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================== IMPORT MODAL =================== */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-800">Import Questions</h3>
                <p className="text-xs text-slate-500 font-medium">Upload CSV, JSON, or Excel file</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-300 transition-colors">
                <input ref={fileInputRef} type="file" accept=".csv,.json,.xlsx" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="text-indigo-600 font-bold text-sm hover:text-indigo-700">
                  {importFile ? `📄 ${importFile.name}` : 'Click to select file'}
                </button>
                <p className="text-xs text-slate-400 mt-2">Supported: .csv, .json</p>
              </div>

              {importing && (
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl">
                  <div className="w-5 h-5 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-indigo-700">Importing questions...</p>
                </div>
              )}

              {importResult && !importResult.error && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-emerald-700 mb-2">✅ Import Complete</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xl font-black text-emerald-700">{importResult.imported}</p>
                      <p className="text-[10px] font-bold text-emerald-500">Imported</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-amber-600">{importResult.duplicatesSkipped}</p>
                      <p className="text-[10px] font-bold text-amber-500">Duplicates</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-red-600">{importResult.errors}</p>
                      <p className="text-[10px] font-bold text-red-500">Errors</p>
                    </div>
                  </div>
                </div>
              )}

              {importResult?.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-red-700">❌ {importResult.error}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl">Close</button>
              <button onClick={handleImport} disabled={!importFile || importing} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50">
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== PREVIEW MODAL =================== */}
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
                  <p className="font-bold text-slate-800 text-lg mb-4">{showPreview.content?.questionText}</p>
                  <div className="space-y-3">
                    {showPreview.content?.options?.map((opt, i) => (
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
                  {showPreview.content?.explanation && (
                    <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-800 mb-1">Explanation</p>
                      <p className="text-sm text-indigo-700">{showPreview.content.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {showPreview.type === 'FILL_BLANK' && (
                <div>
                  <p className="font-bold text-slate-800 text-lg mb-4">{showPreview.content?.questionText}</p>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
                    <p className="text-xs font-bold text-emerald-800 mb-1">Correct Answer</p>
                    <p className="text-sm font-bold text-emerald-700">{showPreview.content?.correctAnswer}</p>
                  </div>
                  {showPreview.content?.explanation && (
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-800 mb-1">Explanation</p>
                      <p className="text-sm text-indigo-700">{showPreview.content.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {showPreview.type === 'PROGRAMMING' && (
                <div>
                  <h4 className="font-black text-xl text-slate-800 mb-4">{showPreview.content?.title}</h4>
                  <div className="prose prose-sm text-slate-600 mb-6 max-w-none">
                    <p>{showPreview.content?.description || showPreview.content?.problemStatement}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 mb-2">Input Format</p>
                      <p className="text-sm font-mono">{showPreview.content?.inputFormat}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 mb-2">Output Format</p>
                      <p className="text-sm font-mono">{showPreview.content?.outputFormat}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                    <p className="text-xs font-bold text-slate-500 mb-2">Constraints</p>
                    <p className="text-sm font-mono text-indigo-600">{showPreview.content?.constraints}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-2">Sample Input</p>
                      <pre className="bg-slate-800 text-slate-300 p-3 rounded-lg text-xs overflow-x-auto">
                        {showPreview.content?.sampleInput}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-2">Sample Output</p>
                      <pre className="bg-slate-800 text-slate-300 p-3 rounded-lg text-xs overflow-x-auto">
                        {showPreview.content?.sampleOutput}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <p className="text-xs font-bold text-slate-500 mb-3">Hidden Test Cases ({showPreview.content?.hiddenTestCases?.length || 0})</p>
                    <div className="space-y-2">
                      {showPreview.content?.hiddenTestCases?.map((tc, i) => (
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
