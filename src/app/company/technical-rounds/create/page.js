'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTechnicalTestPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [passingMarks, setPassingMarks] = useState(12);
  const [duration, setDuration] = useState(45);
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedSections, setGeneratedSections] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1=Config, 2=Review, 3=Save

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper function to extract programming language from jobRole
  function getLanguageFromRole(role) {
    if (!role) return '';
    const r = role.toLowerCase();
    if (r.includes('python')) return 'python';
    if (r.includes('java') && !r.includes('javascript')) return 'java';
    if (r.includes('javascript') || r.includes('node') || r.includes('react')) return 'javascript';
    if (r.includes('cpp') || r.includes('c++')) return 'cpp';
    return '';
  }

  // Manual Question Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualType, setManualType] = useState('MCQ'); // MCQ, FILL_BLANK, PROGRAMMING
  
  // Common Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualDomain, setManualDomain] = useState('');
  const [manualIndustry, setManualIndustry] = useState('');
  const [manualTech, setManualTech] = useState('');
  const [manualDifficulty, setManualDifficulty] = useState('Medium');
  const [manualTags, setManualTags] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualAttachments, setManualAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // MCQ specific
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [mcqCorrect, setMcqCorrect] = useState('A');
  const [mcqExplanation, setMcqExplanation] = useState('');

  // Fill in Blank specific
  const [fillQuestion, setFillQuestion] = useState('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [fillExplanation, setFillExplanation] = useState('');

  // Programming specific
  const [progStatement, setProgStatement] = useState('');
  const [progConstraints, setProgConstraints] = useState('');
  const [progInputFormat, setProgInputFormat] = useState('');
  const [progOutputFormat, setProgOutputFormat] = useState('');
  const [progSampleInput, setProgSampleInput] = useState('');
  const [progSampleOutput, setProgSampleOutput] = useState('');
  const [progExplanation, setProgExplanation] = useState('');
  const [progStarterCode, setProgStarterCode] = useState('');
  const [progTestCases, setProgTestCases] = useState([
    { input: '', expectedOutput: '' },
    { input: '', expectedOutput: '' },
    { input: '', expectedOutput: '' },
    { input: '', expectedOutput: '' },
    { input: '', expectedOutput: '' }
  ]);

  // Predefined roles
  const jobRoles = [
    'Python Developer', 'Java Developer', 'Data Analyst', 'Data Scientist',
    'Full Stack Developer', 'UI/UX Designer', 'Software Tester', 'Cloud Engineer',
    'Cyber Security', 'React Developer', 'Node.js Developer', 'Machine Learning Engineer',
    'Other'
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/company/jobs');
      const data = await res.json();
      if (data.success) setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const handleGenerate = async () => {
    const role = selectedJobRole === 'Other' ? customRole : selectedJobRole;
    if (!role) {
      setError('Please select or enter a job role');
      return;
    }
    if (!selectedJobId) {
      setError('Please select a job posting');
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const res = await fetch('/api/company/technical-tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRole: role, customInstructions })
      });
      const data = await res.json();

      if (data.success) {
        setGeneratedSections(data.sections);
        setStep(2);
      } else {
        setError(data.message || 'Generation failed');
      }
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    const role = selectedJobRole === 'Other' ? customRole : selectedJobRole;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/company/technical-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJobId,
          jobRole: role,
          passingMarks,
          duration,
          sections: generatedSections
        })
      });
      const data = await res.json();

      if (data.success) {
        setStep(3);
        setTimeout(() => router.push('/company/technical-rounds'), 2000);
      } else {
        setError(data.errors ? data.errors.join(', ') : data.message);
      }
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Inline question editor
  const updateMCQ = (index, field, value) => {
    setGeneratedSections(prev => {
      const updated = { ...prev };
      updated.sectionA_MCQ = [...prev.sectionA_MCQ];
      updated.sectionA_MCQ[index] = { ...updated.sectionA_MCQ[index], [field]: value };
      return updated;
    });
  };

  const updateMCQOption = (qIndex, optIndex, value) => {
    setGeneratedSections(prev => {
      const updated = { ...prev };
      updated.sectionA_MCQ = [...prev.sectionA_MCQ];
      const options = [...updated.sectionA_MCQ[qIndex].options];
      options[optIndex] = value;
      updated.sectionA_MCQ[qIndex] = { ...updated.sectionA_MCQ[qIndex], options };
      return updated;
    });
  };

  const updateFillBlank = (index, field, value) => {
    setGeneratedSections(prev => {
      const updated = { ...prev };
      updated.sectionB_FillBlanks = [...prev.sectionB_FillBlanks];
      updated.sectionB_FillBlanks[index] = { ...updated.sectionB_FillBlanks[index], [field]: value };
      return updated;
    });
  };

  const updateProgramming = (section, field, value) => {
    setGeneratedSections(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const updateTestCase = (section, tcIndex, field, value) => {
    setGeneratedSections(prev => {
      const updated = { ...prev };
      const hiddenTestCases = [...prev[section].hiddenTestCases];
      hiddenTestCases[tcIndex] = { ...hiddenTestCases[tcIndex], [field]: value };
      return { ...updated, [section]: { ...updated[section], hiddenTestCases } };
    });
  };

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setManualAttachments(prev => [...prev, { filename: data.filename, fileUrl: data.fileUrl }]);
        showToast('Attachment uploaded successfully!');
      } else {
        showToast(data.message || 'File upload failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('File upload failed', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (index) => {
    setManualAttachments(prev => prev.filter((_, i) => i !== index));
    showToast('Attachment removed');
  };

  // Save manual question handler
  const handleSaveManual = async (statusVal) => {
    const role = selectedJobRole === 'Other' ? customRole : selectedJobRole;
    const tagsArr = manualTags.split(',').map(t => t.trim()).filter(Boolean);
    
    let content = {};
    if (manualType === 'MCQ') {
      if (!mcqQuestion) { showToast('Question Text is required', 'error'); return; }
      if (mcqOptions.some(o => !o.trim())) { showToast('All 4 options are required', 'error'); return; }
      content = {
        questionText: mcqQuestion,
        options: mcqOptions,
        correctAnswer: mcqCorrect,
        explanation: mcqExplanation
      };
    } else if (manualType === 'FILL_BLANK') {
      if (!fillQuestion) { showToast('Question Text is required', 'error'); return; }
      if (!fillAnswer) { showToast('Correct answer is required', 'error'); return; }
      content = {
        questionText: fillQuestion,
        correctAnswer: fillAnswer,
        explanation: fillExplanation
      };
    } else if (manualType === 'PROGRAMMING') {
      if (!manualTitle) { showToast('Question Title is required', 'error'); return; }
      if (!progStatement) { showToast('Problem Statement is required', 'error'); return; }
      if (progTestCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim())) {
        showToast('All test cases require input and expected output', 'error');
        return;
      }
      content = {
        title: manualTitle,
        problemStatement: progStatement,
        inputFormat: progInputFormat,
        outputFormat: progOutputFormat,
        constraints: progConstraints,
        sampleInput: progSampleInput,
        sampleOutput: progSampleOutput,
        hiddenTestCases: progTestCases,
        starterCode: progStarterCode,
        explanation: progExplanation
      };
    }

    const payload = {
      jobRole: manualDomain || role || 'Technical',
      category: manualIndustry || 'Technical',
      type: manualType,
      tags: tagsArr.length > 0 ? tagsArr : [manualTech || 'Technical'],
      language: manualTech || null,
      content,
      difficulty: manualDifficulty,
      domain: manualDomain || role || 'Technical',
      topic: manualIndustry || 'Technical',
      source: 'Manual',
      status: statusVal,
      approved: statusVal === 'Approved',
      attachments: manualAttachments
    };

    try {
      const res = await fetch('/api/company/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Question saved successfully as ${statusVal}!`);
        setShowManualModal(false);
        // Clear Form state
        setManualTitle('');
        setManualDomain('');
        setManualIndustry('');
        setManualTech('');
        setManualDifficulty('Medium');
        setManualTags('');
        setManualDescription('');
        setManualAttachments([]);
        setMcqQuestion('');
        setMcqOptions(['', '', '', '']);
        setFillQuestion('');
        setFillAnswer('');
        setProgStatement('');
        setProgTestCases([
          { input: '', expectedOutput: '' },
          { input: '', expectedOutput: '' },
          { input: '', expectedOutput: '' },
          { input: '', expectedOutput: '' },
          { input: '', expectedOutput: '' }
        ]);
      } else {
        showToast(data.message || 'Failed to save question', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error occurred while saving question', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg text-white text-sm animate-bounce ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Create Technical Test</h1>
          <p className="text-slate-500 text-sm font-medium">Hybrid and AI-powered question generation</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Configure', 'Review & Edit', 'Saved'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${step === i + 1 ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
            {i < 2 && <div className={`w-8 sm:w-16 h-0.5 ${step > i + 1 ? 'bg-emerald-400' : 'bg-slate-200'}`}></div>}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Step 1: Configuration */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Test Configuration</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Select Job Posting *</label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
              >
                <option value="">Choose a job...</option>
                {jobs.map(job => (
                  <option key={job._id} value={job._id}>{job.title} — {job.role || job.department}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Job Role *</label>
              <select
                value={selectedJobRole}
                onChange={(e) => setSelectedJobRole(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
              >
                <option value="">Choose a role...</option>
                {jobRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {selectedJobRole === 'Other' && (
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Enter custom role name"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Duration (minutes)</label>
              <input
                type="number"
                min="15"
                max="180"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Passing Marks (out of 20)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-600 mb-2">Custom AI Instructions (Optional)</label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Focus on React hooks for the frontend questions, or ask advanced backend architecture questions. Specify the exact topics you want the AI to cover."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
            />
            <p className="text-xs text-slate-500 mt-2 font-medium">Add specific topics, difficulty level, or technologies to customize the generated questions for your exact needs.</p>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 mb-8">
            <h3 className="text-sm font-bold text-indigo-800 mb-2">📋 Fixed Test Pattern (20 Marks)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-indigo-700 font-medium">
              <div className="bg-white/60 rounded-lg p-2.5 text-center">
                <p className="font-bold text-base">5</p><p>MCQs (5 marks)</p>
              </div>
              <div className="bg-white/60 rounded-lg p-2.5 text-center">
                <p className="font-bold text-base">5</p><p>Fill Blanks (5 marks)</p>
              </div>
              <div className="bg-white/60 rounded-lg p-2.5 text-center">
                <p className="font-bold text-base">1</p><p>Program 1 (5 marks)</p>
              </div>
              <div className="bg-white/60 rounded-lg p-2.5 text-center">
                <p className="font-bold text-base">1</p><p>Program 2 (5 marks)</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button
              onClick={() => {
                const role = selectedJobRole === 'Other' ? customRole : selectedJobRole;
                setManualDomain(role || '');
                setManualTech(getLanguageFromRole(role) || '');
                setShowManualModal(true);
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
              + Add Question Manually
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review & Edit Generated Questions */}
      {step === 2 && generatedSections && (
        <div className="space-y-6">
          {/* Section A: MCQs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Section A — Multiple Choice Questions</h2>
            <p className="text-xs text-slate-500 mb-4">5 Questions × 1 Mark = 5 Marks</p>
            <div className="space-y-5">
              {generatedSections.sectionA_MCQ?.map((mcq, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md">Q{i + 1}</span>
                    <span className="text-[10px] text-slate-400 font-bold">1 MARK</span>
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
                    <input
                      type="text"
                      value={mcq.explanation || ''}
                      onChange={(e) => updateMCQ(i, 'explanation', e.target.value)}
                      placeholder="Explanation..."
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Fill-in-the-Blanks */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Section B — Fill in the Blanks</h2>
            <p className="text-xs text-slate-500 mb-4">5 Questions × 1 Mark = 5 Marks</p>
            <div className="space-y-4">
              {generatedSections.sectionB_FillBlanks?.map((fb, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md">Q{i + 1}</span>
                    <span className="text-[10px] text-slate-400 font-bold">1 MARK</span>
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
          {['sectionC_Programming1', 'sectionD_Programming2'].map((section, idx) => {
            const prog = generatedSections[section];
            const sectionLabel = idx === 0 ? 'C' : 'D';
            return (
              <div key={section} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-1">Section {sectionLabel} — Programming Question {idx + 1}</h2>
                <p className="text-xs text-slate-500 mb-4">5 Marks (evaluated via hidden test cases)</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Title</label>
                    <input
                      type="text"
                      value={prog?.title || ''}
                      onChange={(e) => updateProgramming(section, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
                    <textarea
                      value={prog?.description || ''}
                      onChange={(e) => updateProgramming(section, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Sample Input</label>
                      <textarea
                        value={prog?.sampleInput || ''}
                        onChange={(e) => updateProgramming(section, 'sampleInput', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Sample Output</label>
                      <textarea
                        value={prog?.sampleOutput || ''}
                        onChange={(e) => updateProgramming(section, 'sampleOutput', e.target.value)}
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
                            onChange={(e) => updateTestCase(section, tci, 'input', e.target.value)}
                            placeholder="Input"
                            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                          <span className="text-xs text-slate-400">→</span>
                          <input
                            type="text"
                            value={tc.expectedOutput}
                            onChange={(e) => updateTestCase(section, tci, 'expectedOutput', e.target.value)}
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

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
            >
              ← Regenerate
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving as Draft...
                </>
              ) : (
                'Save as Draft ✓'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Technical Test Saved!</h2>
          <p className="text-slate-500 font-medium mb-1">The test has been saved as <span className="text-amber-600 font-bold">Draft</span>.</p>
          <p className="text-slate-400 text-sm">Redirecting to Technical Rounds...</p>
        </div>
      )}

      {/* Manual Question Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="font-black text-lg text-slate-800">➕ Add Question Manually</h3>
                <p className="text-xs text-slate-500 font-medium">Create a question to be added to the Question Bank</p>
              </div>
              <button 
                onClick={() => setShowManualModal(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Question Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Question Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['MCQ', 'FILL_BLANK', 'PROGRAMMING'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setManualType(t)}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all ${manualType === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {t === 'MCQ' ? 'Multiple Choice' : t === 'FILL_BLANK' ? 'Fill in Blank' : 'Programming'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Common Fields */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Common Metadata</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {manualType === 'PROGRAMMING' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Question Title *</label>
                      <input
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="e.g. Unique Path Count"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Preferred Domain / Job Role</label>
                    <input
                      type="text"
                      value={manualDomain}
                      onChange={(e) => setManualDomain(e.target.value)}
                      placeholder="e.g. Python Developer"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Industry Track / Category</label>
                    <input
                      type="text"
                      value={manualIndustry}
                      onChange={(e) => setManualIndustry(e.target.value)}
                      placeholder="e.g. IT Services"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Technology (e.g. Language)</label>
                    <input
                      type="text"
                      value={manualTech}
                      onChange={(e) => setManualTech(e.target.value)}
                      placeholder="e.g. python, javascript"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Difficulty Level</label>
                    <select
                      value={manualDifficulty}
                      onChange={(e) => setManualDifficulty(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      value={manualTags}
                      onChange={(e) => setManualTags(e.target.value)}
                      placeholder="e.g. algorithm, recursion, dp"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Brief Description (Optional)</label>
                    <textarea
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="Enter a brief internal note or description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* MCQ Fields */}
              {manualType === 'MCQ' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Question Text *</label>
                    <textarea
                      value={mcqQuestion}
                      onChange={(e) => setMcqQuestion(e.target.value)}
                      placeholder="Enter the question text..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((optKey, idx) => (
                      <div key={optKey}>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Option {optKey} *</label>
                        <input
                          type="text"
                          value={mcqOptions[idx]}
                          onChange={(e) => {
                            const newOpts = [...mcqOptions];
                            newOpts[idx] = e.target.value;
                            setMcqOptions(newOpts);
                          }}
                          placeholder={`Option ${optKey} content`}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Correct Answer *</label>
                      <select
                        value={mcqCorrect}
                        onChange={(e) => setMcqCorrect(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold"
                      >
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Explanation (Optional)</label>
                      <input
                        type="text"
                        value={mcqExplanation}
                        onChange={(e) => setMcqExplanation(e.target.value)}
                        placeholder="Explain why this option is correct..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fill in the Blank Fields */}
              {manualType === 'FILL_BLANK' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Question Text * (Use ______ for the blank)</label>
                    <textarea
                      value={fillQuestion}
                      onChange={(e) => setFillQuestion(e.target.value)}
                      placeholder="e.g. The ______ keyword is used to define a function in Python."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Correct Answer *</label>
                      <input
                        type="text"
                        value={fillAnswer}
                        onChange={(e) => setFillAnswer(e.target.value)}
                        placeholder="e.g. def"
                        className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50 font-bold text-emerald-700"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Explanation (Optional)</label>
                      <input
                        type="text"
                        value={fillExplanation}
                        onChange={(e) => setFillExplanation(e.target.value)}
                        placeholder="e.g. def is the standard keyword for defining functions..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Programming Fields */}
              {manualType === 'PROGRAMMING' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Problem Statement *</label>
                    <textarea
                      value={progStatement}
                      onChange={(e) => setProgStatement(e.target.value)}
                      placeholder="Write the full description and requirements of the coding challenge..."
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Constraints</label>
                      <input
                        type="text"
                        value={progConstraints}
                        onChange={(e) => setProgConstraints(e.target.value)}
                        placeholder="e.g. 1 <= N <= 100000"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Input Format</label>
                      <input
                        type="text"
                        value={progInputFormat}
                        onChange={(e) => setProgInputFormat(e.target.value)}
                        placeholder="Description of input"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Output Format</label>
                      <input
                        type="text"
                        value={progOutputFormat}
                        onChange={(e) => setProgOutputFormat(e.target.value)}
                        placeholder="Description of output"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Sample Input</label>
                      <textarea
                        value={progSampleInput}
                        onChange={(e) => setProgSampleInput(e.target.value)}
                        placeholder="Sample input data..."
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Sample Output</label>
                      <textarea
                        value={progSampleOutput}
                        onChange={(e) => setProgSampleOutput(e.target.value)}
                        placeholder="Sample expected output..."
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Starter Code (Optional)</label>
                    <textarea
                      value={progStarterCode}
                      onChange={(e) => setProgStarterCode(e.target.value)}
                      placeholder="e.g. def solve(n): # write code here"
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-mono resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Explanation (Optional)</label>
                    <input
                      type="text"
                      value={progExplanation}
                      onChange={(e) => setProgExplanation(e.target.value)}
                      placeholder="Brief logic/explanation for this programming problem..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    />
                  </div>

                  {/* Hidden Test Cases */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-xs font-bold text-slate-600">🔒 Hidden Test Cases ({progTestCases.length} total, 5 recommended) *</label>
                      <button
                        type="button"
                        onClick={() => setProgTestCases(prev => [...prev, { input: '', expectedOutput: '' }])}
                        className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded hover:bg-indigo-100 transition-colors"
                      >
                        + Add Case
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                      {progTestCases.map((tc, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 w-6">TC{idx + 1}</span>
                          <input
                            type="text"
                            value={tc.input}
                            onChange={(e) => {
                              const list = [...progTestCases];
                              list[idx].input = e.target.value;
                              setProgTestCases(list);
                            }}
                            placeholder="Input"
                            className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs font-mono bg-white"
                          />
                          <span className="text-slate-300">→</span>
                          <input
                            type="text"
                            value={tc.expectedOutput}
                            onChange={(e) => {
                              const list = [...progTestCases];
                              list[idx].expectedOutput = e.target.value;
                              setProgTestCases(list);
                            }}
                            placeholder="Expected Output"
                            className="flex-1 px-2 py-1 border border-slate-250 rounded text-xs font-mono bg-white"
                          />
                          {progTestCases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setProgTestCases(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 font-bold text-xs p-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="border-t border-slate-150 pt-6">
                <label className="block text-xs font-bold text-slate-600 mb-2">📎 Attachments (Images, PDF, ZIP, Code Templates)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="attachment-upload"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFile}
                  />
                  <label
                    htmlFor="attachment-upload"
                    className={`px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-2 ${uploadingFile ? 'opacity-60' : ''}`}
                  >
                    {uploadingFile ? (
                      <>
                        <div className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Upload Attachment
                      </>
                    )}
                  </label>
                </div>

                {/* Attachments List */}
                {manualAttachments.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {manualAttachments.map((att, attIdx) => (
                      <div key={attIdx} className="flex justify-between items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
                        <span className="truncate font-medium text-slate-700 flex-1 mr-2" title={att.filename}>{att.filename}</span>
                        <div className="flex gap-2">
                          <a href={att.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 font-bold">View</a>
                          <button type="button" onClick={() => removeAttachment(attIdx)} className="text-red-500 hover:text-red-700 font-bold">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-350 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveManual('Pending Review')}
                className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveManual('Approved')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
              >
                Save & Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
