'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditTechnicalTestPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [test, setTest] = useState(null);
  const [sections, setSections] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  const fetchTestDetails = async () => {
    try {
      const res = await fetch(`/api/company/technical-tests/${id}`);
      const data = await res.json();
      if (data.success) {
        if (data.data.test.status !== 'Draft') {
          setError('Only Draft tests can be edited.');
        } else {
          setTest(data.data.test);
          setSections(data.data.test.sections);
        }
      } else {
        setError(data.message || 'Failed to fetch test details');
      }
    } catch (err) {
      setError('Server error while fetching details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/company/technical-tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobRole: test.jobRole,
          passingMarks: test.passingMarks,
          duration: test.duration,
          sections
        })
      });
      const data = await res.json();

      if (data.success) {
        router.push(`/company/technical-rounds/${id}`);
      } else {
        setError(data.errors ? data.errors.join(', ') : data.message);
      }
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Field updates
  const updateTestField = (field, value) => {
    setTest(prev => ({ ...prev, [field]: value }));
  };

  // Section Editors
  const updateMCQ = (index, field, value) => {
    setSections(prev => {
      const updated = { ...prev };
      updated.sectionA_MCQ = [...prev.sectionA_MCQ];
      updated.sectionA_MCQ[index] = { ...updated.sectionA_MCQ[index], [field]: value };
      return updated;
    });
  };

  const updateMCQOption = (qIndex, optIndex, value) => {
    setSections(prev => {
      const updated = { ...prev };
      updated.sectionA_MCQ = [...prev.sectionA_MCQ];
      const options = [...updated.sectionA_MCQ[qIndex].options];
      options[optIndex] = value;
      updated.sectionA_MCQ[qIndex] = { ...updated.sectionA_MCQ[qIndex], options };
      return updated;
    });
  };

  const updateFillBlank = (index, field, value) => {
    setSections(prev => {
      const updated = { ...prev };
      updated.sectionB_FillBlanks = [...prev.sectionB_FillBlanks];
      updated.sectionB_FillBlanks[index] = { ...updated.sectionB_FillBlanks[index], [field]: value };
      return updated;
    });
  };

  const updateProgramming = (sectionKey, field, value) => {
    setSections(prev => ({ ...prev, [sectionKey]: { ...prev[sectionKey], [field]: value } }));
  };

  const updateTestCase = (sectionKey, tcIndex, field, value) => {
    setSections(prev => {
      const updated = { ...prev };
      const hiddenTestCases = [...prev[sectionKey].hiddenTestCases];
      hiddenTestCases[tcIndex] = { ...hiddenTestCases[tcIndex], [field]: value };
      return { ...updated, [sectionKey]: { ...updated[sectionKey], hiddenTestCases } };
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error && !sections) return (
    <div className="bg-red-50 text-red-600 p-8 rounded-2xl text-center max-w-2xl mx-auto mt-10 font-medium">
      {error}
      <button onClick={() => router.push('/company/technical-rounds')} className="block mt-4 text-sm text-red-800 underline mx-auto">Back to Technical Rounds</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Edit Technical Test (Draft)</h1>
            <p className="text-slate-500 text-sm font-medium">For {test?.jobRole}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Basic Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Test Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Job Role</label>
            <input
              type="text"
              value={test.jobRole || ''}
              onChange={(e) => updateTestField('jobRole', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Duration (minutes)</label>
            <input
              type="number"
              min="15"
              value={test.duration || 45}
              onChange={(e) => updateTestField('duration', Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Passing Marks (out of 20)</label>
            <input
              type="number"
              min="1"
              max="20"
              value={test.passingMarks || 12}
              onChange={(e) => updateTestField('passingMarks', Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section A: MCQs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Section A — Multiple Choice Questions</h2>
          <div className="space-y-5 mt-4">
            {sections.sectionA_MCQ?.map((mcq, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md">Q{i + 1}</span>
                </div>
                <textarea
                  value={mcq.question}
                  onChange={(e) => updateMCQ(i, 'question', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
                  rows={2}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {mcq.options?.map((opt, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${mcq.correctOption === ['A', 'B', 'C', 'D'][j] ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {['A', 'B', 'C', 'D'][j]}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateMCQOption(i, j, e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-500">Correct:</label>
                  <select
                    value={mcq.correctOption}
                    onChange={(e) => updateMCQ(i, 'correctOption', e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section B: Fill-in-the-Blanks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Section B — Fill in the Blanks</h2>
          <div className="space-y-4 mt-4">
            {sections.sectionB_FillBlanks?.map((fb, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md">Q{i + 1}</span>
                </div>
                <textarea
                  value={fb.question}
                  onChange={(e) => updateFillBlank(i, 'question', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
                  rows={2}
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 shrink-0">Answer:</label>
                  <input
                    type="text"
                    value={fb.correctAnswer}
                    onChange={(e) => updateFillBlank(i, 'correctAnswer', e.target.value)}
                    className="flex-1 px-3 py-2 border border-emerald-200 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section C & D: Programming */}
        {['sectionC_Programming1', 'sectionD_Programming2'].map((sectionKey, idx) => {
          const prog = sections[sectionKey];
          const sectionLabel = idx === 0 ? 'C' : 'D';
          return (
            <div key={sectionKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Section {sectionLabel} — Programming Question {idx + 1}</h2>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Title</label>
                  <input
                    type="text"
                    value={prog?.title || ''}
                    onChange={(e) => updateProgramming(sectionKey, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
                  <textarea
                    value={prog?.description || ''}
                    onChange={(e) => updateProgramming(sectionKey, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Sample Input</label>
                    <textarea
                      value={prog?.sampleInput || ''}
                      onChange={(e) => updateProgramming(sectionKey, 'sampleInput', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Sample Output</label>
                    <textarea
                      value={prog?.sampleOutput || ''}
                      onChange={(e) => updateProgramming(sectionKey, 'sampleOutput', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Hidden Test Cases */}
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-2 block">🔒 Hidden Test Cases (5 required)</label>
                  <div className="space-y-2">
                    {prog?.hiddenTestCases?.map((tc, tci) => (
                      <div key={tci} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 w-6 shrink-0">TC{tci + 1}</span>
                        <input
                          type="text"
                          value={tc.input}
                          onChange={(e) => updateTestCase(sectionKey, tci, 'input', e.target.value)}
                          placeholder="Input"
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                        <span className="text-xs text-slate-400">→</span>
                        <input
                          type="text"
                          value={tc.expectedOutput}
                          onChange={(e) => updateTestCase(sectionKey, tci, 'expectedOutput', e.target.value)}
                          placeholder="Expected Output"
                          className="flex-1 px-2 py-1.5 border border-emerald-200 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
