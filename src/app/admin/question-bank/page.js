'use client';

import { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function AdminQuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ domain: '', level: '', difficulty: '', keyword: '' });
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit, view
  const [currentQuestion, setCurrentQuestion] = useState(getEmptyQuestion());
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStats();
    fetchQuestions();
  }, [page, filters.domain, filters.level, filters.difficulty]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchQuestions();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [filters.keyword]);

  function getEmptyQuestion() {
    return { domain: '', level: '', topic: '', difficulty: 'Medium', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' };
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/questions/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        domain: filters.domain,
        level: filters.level,
        difficulty: filters.difficulty,
        keyword: filters.keyword
      });
      const res = await fetch(`/api/admin/questions?${query}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    const isEdit = modalMode === 'edit';
    const url = isEdit ? `/api/admin/questions/${currentQuestion._id}` : '/api/admin/questions';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentQuestion)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchQuestions();
        fetchStats();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error saving question');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchQuestions();
        fetchStats();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error deleting question');
    }
  };

  const processImportFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => handleParsedData(results.data)
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        handleParsedData(json);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Unsupported file format. Please use CSV or Excel.');
    }
  };

  const handleParsedData = async (data) => {
    setImporting(true);
    setImportResult(null);

    const formattedQuestions = data.map(row => {
      // Handle array parsing for options if they are stored as JSON strings, or fallback to separate columns
      let options = ['', '', '', ''];
      try {
        if (row.options) {
          options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
        } else {
          options = [row.OptionA || row.optionA || row['Option A'] || '', row.OptionB || row.optionB || row['Option B'] || '', row.OptionC || row.optionC || row['Option C'] || '', row.OptionD || row.optionD || row['Option D'] || ''];
        }
      } catch(e) {}

      return {
        domain: row.domain || row.Domain || '',
        level: (row.level || row.Level || '').toLowerCase(),
        topic: row.topic || row.Topic || 'General',
        questionText: row.questionText || row.Question || row.question || '',
        options: options,
        correctOptionIndex: parseInt(row.correctOptionIndex !== undefined ? row.correctOptionIndex : (row.CorrectOptionIndex || 0)),
        explanation: row.explanation || row.Explanation || 'No explanation provided.',
        difficulty: row.difficulty || row.Difficulty || 'Medium'
      };
    });

    try {
      const res = await fetch('/api/admin/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: formattedQuestions })
      });
      const result = await res.json();
      setImportResult(result);
      if (result.success) {
        fetchStats();
        fetchQuestions();
      }
    } catch (err) {
      setImportResult({ success: false, message: 'Upload failed.' });
    } finally {
      setImporting(false);
    }
  };

  const exportToExcel = async () => {
    // Fetch all for export (without pagination limits, though typically you'd page it server side. For this we'll export current filtered view but up to 10000)
    try {
      const query = new URLSearchParams({
        limit: 10000,
        domain: filters.domain,
        level: filters.level,
        difficulty: filters.difficulty,
        keyword: filters.keyword
      });
      const res = await fetch(`/api/admin/questions?${query}`);
      const data = await res.json();
      
      if (!data.success || !data.questions.length) return alert('No data to export');

      const exportData = data.questions.map(q => ({
        Domain: q.domain,
        Level: q.level,
        Topic: q.topic,
        Difficulty: q.difficulty,
        Question: q.questionText,
        'Option A': q.options[0],
        'Option B': q.options[1],
        'Option C': q.options[2],
        'Option D': q.options[3],
        CorrectOptionIndex: q.correctOptionIndex,
        Explanation: q.explanation
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
      XLSX.writeFile(workbook, 'QuestionBank_Export.xlsx');

    } catch (err) {
      alert('Export failed');
    }
  };

  const exportToCSV = async () => {
    try {
      const query = new URLSearchParams({
        limit: 10000,
        domain: filters.domain,
        level: filters.level,
        difficulty: filters.difficulty,
        keyword: filters.keyword
      });
      const res = await fetch(`/api/admin/questions?${query}`);
      const data = await res.json();
      
      if (!data.success || !data.questions.length) return alert('No data to export');

      const exportData = data.questions.map(q => ({
        domain: q.domain,
        level: q.level,
        topic: q.topic,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: JSON.stringify(q.options),
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'QuestionBank_Export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      alert('Export failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Question Bank</h1>
          <p className="text-slate-500">Manage the self-assessment database</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowImportModal(true); setImportResult(null); }} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition">Import</button>
          <div className="relative group">
            <button className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition">Export ▼</button>
            <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded shadow-lg hidden group-hover:block z-10">
              <button onClick={exportToCSV} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">To CSV</button>
              <button onClick={exportToExcel} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">To Excel</button>
            </div>
          </div>
          <button onClick={() => { setModalMode('add'); setCurrentQuestion(getEmptyQuestion()); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">+ Add Question</button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium">Total Questions</h3>
            <p className="text-2xl font-bold text-slate-800">{stats.totalQuestions}</p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">L: {stats.lowCount}</span>
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">M: {stats.mediumCount}</span>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded">H: {stats.highCount}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium">Total Domains</h3>
            <p className="text-2xl font-bold text-slate-800">{stats.totalDomains}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 md:col-span-2">
            <h3 className="text-slate-500 text-sm font-medium">Insufficient Domains (&lt; 240)</h3>
            <div className="mt-2 flex flex-wrap gap-2 max-h-16 overflow-y-auto">
              {stats.insufficientDomains.length === 0 ? <span className="text-sm text-green-600">All domains have 240+ questions</span> : 
               stats.insufficientDomains.map(d => (
                 <span key={d.domain} className="text-xs bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded">
                   {d.domain} ({d.count})
                 </span>
               ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
        <input 
          type="text" 
          placeholder="Search keyword..." 
          className="px-3 py-2 border rounded border-slate-300 focus:outline-none focus:border-blue-500 flex-1 min-w-[200px]"
          value={filters.keyword}
          onChange={(e) => setFilters({...filters, keyword: e.target.value})}
        />
        <input 
          type="text" 
          placeholder="Filter Domain" 
          className="px-3 py-2 border rounded border-slate-300 focus:outline-none focus:border-blue-500"
          value={filters.domain}
          onChange={(e) => setFilters({...filters, domain: e.target.value})}
        />
        <select 
          className="px-3 py-2 border rounded border-slate-300 focus:outline-none focus:border-blue-500"
          value={filters.level}
          onChange={(e) => setFilters({...filters, level: e.target.value})}
        >
          <option value="">All Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select 
          className="px-3 py-2 border rounded border-slate-300 focus:outline-none focus:border-blue-500"
          value={filters.difficulty}
          onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Topic</th>
                <th className="px-4 py-3 font-medium">Question</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : questions.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No questions found.</td></tr>
              ) : (
                questions.map(q => (
                  <tr key={q._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-sm text-slate-800">{q.domain}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${q.level === 'low' ? 'bg-green-100 text-green-700' : q.level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {q.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{q.topic}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 max-w-xs truncate" title={q.questionText}>{q.questionText}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => { setCurrentQuestion(q); setModalMode('view'); setShowModal(true); }} className="text-blue-600 hover:underline">View</button>
                        <button onClick={() => { setCurrentQuestion(q); setModalMode('edit'); setShowModal(true); }} className="text-emerald-600 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(q._id)} className="text-red-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 flex justify-between items-center bg-slate-50">
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-white border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50">Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-white border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {modalMode === 'add' ? 'Add New Question' : modalMode === 'edit' ? 'Edit Question' : 'View Question'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="question-form" onSubmit={handleSaveQuestion} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Domain</label>
                    <input required disabled={modalMode === 'view'} type="text" className="w-full px-3 py-2 border rounded" value={currentQuestion.domain} onChange={e => setCurrentQuestion({...currentQuestion, domain: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                    <input required disabled={modalMode === 'view'} type="text" className="w-full px-3 py-2 border rounded" value={currentQuestion.topic} onChange={e => setCurrentQuestion({...currentQuestion, topic: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                    <select required disabled={modalMode === 'view'} className="w-full px-3 py-2 border rounded" value={currentQuestion.level} onChange={e => setCurrentQuestion({...currentQuestion, level: e.target.value})}>
                      <option value="">Select Level...</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                    <select required disabled={modalMode === 'view'} className="w-full px-3 py-2 border rounded" value={currentQuestion.difficulty} onChange={e => setCurrentQuestion({...currentQuestion, difficulty: e.target.value})}>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
                  <textarea required disabled={modalMode === 'view'} rows={3} className="w-full px-3 py-2 border rounded" value={currentQuestion.questionText} onChange={e => setCurrentQuestion({...currentQuestion, questionText: e.target.value})}></textarea>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Options</label>
                  {[0, 1, 2, 3].map(idx => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input 
                        type="radio" 
                        name="correctOption" 
                        disabled={modalMode === 'view'}
                        checked={currentQuestion.correctOptionIndex === idx} 
                        onChange={() => setCurrentQuestion({...currentQuestion, correctOptionIndex: idx})}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <input 
                        required 
                        disabled={modalMode === 'view'}
                        type="text" 
                        className={`flex-1 px-3 py-2 border rounded ${currentQuestion.correctOptionIndex === idx ? 'border-green-500 bg-green-50' : 'border-slate-300'}`}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={currentQuestion.options[idx]}
                        onChange={e => {
                          const newOpts = [...currentQuestion.options];
                          newOpts[idx] = e.target.value;
                          setCurrentQuestion({...currentQuestion, options: newOpts});
                        }}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 italic">Select the radio button next to the correct option.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Explanation</label>
                  <textarea required disabled={modalMode === 'view'} rows={2} className="w-full px-3 py-2 border rounded" value={currentQuestion.explanation} onChange={e => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}></textarea>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-100">Close</button>
              {modalMode !== 'view' && (
                <button type="submit" form="question-form" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Question</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Bulk Import Questions</h2>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6">
              {!importResult ? (
                <>
                  <p className="text-sm text-slate-600 mb-4">
                    Upload a CSV or Excel (.xlsx) file. The file must contain headers matching the required fields: <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600 text-xs">domain, level, topic, questionText, optionA, optionB, optionC, optionD, correctOptionIndex, explanation, difficulty</code>.
                  </p>
                  <input 
                    type="file" 
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => setImportFile(e.target.files[0])}
                  />
                  {importing && <p className="mt-4 text-blue-600 text-sm font-medium animate-pulse">Processing file... Please wait.</p>}
                </>
              ) : (
                <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h3 className={`font-bold ${importResult.success ? 'text-green-800' : 'text-red-800'} mb-2`}>
                    {importResult.success ? 'Import Complete' : 'Import Failed'}
                  </h3>
                  <p className="text-sm text-slate-700 mb-2">{importResult.message}</p>
                  {importResult.stats && (
                    <ul className="text-sm text-slate-600 space-y-1 mt-3">
                      <li>• Total Processed: <strong>{importResult.stats.processed}</strong></li>
                      <li>• Successfully Inserted: <strong className="text-green-600">{importResult.stats.inserted}</strong></li>
                      <li>• Skipped (Duplicates): <strong className="text-yellow-600">{importResult.stats.skippedDuplicates}</strong></li>
                      <li>• Rejected (Invalid Data): <strong className="text-red-600">{importResult.stats.rejectedInvalid}</strong></li>
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button onClick={() => { setShowImportModal(false); setImportFile(null); }} className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-100">Close</button>
              {!importResult && (
                <button 
                  onClick={() => { if(importFile) processImportFile(importFile); else alert('Select a file first'); }} 
                  disabled={importing || !importFile} 
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Start Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
