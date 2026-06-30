'use client';

import { useState, useEffect } from 'react';

export default function JobAssessments() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('All');
  const [candidates, setCandidates] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [status, setStatus] = useState('All');
  const [scoreRange, setScoreRange] = useState('');
  const [date, setDate] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    fetchAssessments();
  }, [selectedJobId, status, scoreRange, date, sortBy]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAssessments();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search, collegeName]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        jobId: selectedJobId,
        search,
        collegeName,
        status,
        scoreRange,
        date,
        sortBy
      });

      const res = await fetch(`/api/company/job-assessments?${params}`);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates || []);
        if (data.jobs && jobs.length === 0) {
          setJobs(data.jobs);
        }
      }
    } catch (error) {
      console.error('Failed to fetch job assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCollegeName('');
    setStatus('All');
    setScoreRange('');
    setDate('');
    setSortBy('latest');
  };

  const closeModal = () => setSelectedReport(null);

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Job Assessment Results</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor candidate assessment details for your published job posts.</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          
          {/* Job dropdown selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Job Post</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-semibold text-slate-700 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <option value="All">All Job Posts</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>{job.title}</option>
              ))}
            </select>
          </div>

          {/* Candidate Search */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Candidate Name / Email</label>
            <input
              type="text"
              placeholder="Search candidate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-medium text-slate-700 placeholder-slate-400"
            />
          </div>

          {/* College Name Search */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">College Name</label>
            <input
              type="text"
              placeholder="Filter by college..."
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-medium text-slate-700 placeholder-slate-400"
            />
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assessment Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-semibold text-slate-700 bg-slate-50/50"
            >
              <option value="All">All Statuses</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
              <option value="Not Taken">Not Taken</option>
            </select>
          </div>

          {/* Score Range Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Score Range</label>
            <select
              value={scoreRange}
              onChange={(e) => setScoreRange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-semibold text-slate-700 bg-slate-50/50"
            >
              <option value="">Any Score</option>
              <option value="85-100">85% - 100% (Job Ready)</option>
              <option value="70-84">70% - 84% (Passed)</option>
              <option value="50-69">50% - 69% (Intermediate)</option>
              <option value="0-49">0% - 49% (Beginner/Fail)</option>
            </select>
          </div>

          {/* Completion Date Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Completion Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-medium text-slate-700 bg-slate-50/50"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-semibold text-slate-700 bg-slate-50/50"
            >
              <option value="latest">Latest Assessment</option>
              <option value="highest">Highest Score</option>
              <option value="lowest">Lowest Score</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              Reset Filters
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-semibold">Fetching assessments...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p className="text-slate-500 font-extrabold text-base">No completed assessments available for this job.</p>
            <p className="text-slate-400 text-xs mt-1">Refine your search criteria or select another job posting.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse table-fixed">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-[20%]">Candidate</th>
                  <th className="px-4 py-3.5 w-[20%]">College</th>
                  <th className="px-4 py-3.5 w-[20%]">Domain / Track</th>
                  <th className="px-4 py-3.5 w-[12%]">Status</th>
                  <th className="px-4 py-3.5 w-[10%]">Score</th>
                  <th className="px-4 py-3.5 w-[18%]">Completed On</th>
                  <th className="px-4 py-3.5 text-right w-[10%]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {candidates.map((cand, idx) => (
                  <tr key={cand.applicationId || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-extrabold text-slate-800 text-sm truncate">{cand.candidateName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{cand.candidateEmail}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs truncate">
                      {cand.collegeName}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-700 truncate">{cand.preferredDomain}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{cand.industryTrack}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold tracking-wider uppercase
                        ${cand.assessmentStatus === 'Pass' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                        ${cand.assessmentStatus === 'Fail' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
                        ${cand.assessmentStatus === 'Not Taken' ? 'bg-slate-100 text-slate-650 border border-slate-200' : ''}
                      `}>
                        {cand.assessmentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {cand.assessmentScore !== null ? (
                        <div className={`text-base font-black ${cand.assessmentScore >= 70 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {cand.assessmentScore}%
                        </div>
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {cand.completionDate ? (
                        <>
                          <div className="text-slate-700 font-semibold">{new Date(cand.completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div className="text-[10px] text-slate-450 mt-0.5">{new Date(cand.completionDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : (
                        <span className="text-slate-350">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {cand.report ? (
                        <button
                          onClick={() => setSelectedReport(cand)}
                          className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          View Report
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-400 font-extrabold rounded-lg cursor-not-allowed opacity-60"
                        >
                          No Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assessment Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800">Job Assessment Report</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {selectedReport.candidateName} — {selectedReport.preferredDomain} ({selectedReport.industryTrack})
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors outline-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-white flex-1 space-y-8 select-text">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-1">Overall Score</p>
                  <p className="text-2xl font-black text-indigo-900">{selectedReport.assessmentScore}%</p>
                </div>
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mb-1">Status</p>
                  <p className="text-2xl font-black text-emerald-900 capitalize">{selectedReport.assessmentStatus}</p>
                </div>
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">Interview Readiness</p>
                  <p className="text-2xl font-black text-blue-900">{selectedReport.report.interviewReadiness || 0}/100</p>
                </div>
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider mb-1">Proctoring Warnings</p>
                  <p className="text-2xl font-black text-purple-900">{selectedReport.report.violations || 0} / 3</p>
                </div>
              </div>

              {/* Assessment Type Check (Option A Historical fallback) */}
              {!selectedReport.report.questions || selectedReport.report.questions.length === 0 ? (
                // Historical Fallback View
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <div>
                      <strong className="block text-amber-950 mb-0.5 text-sm">Detailed Report Partially Unavailable</strong>
                      Detailed question-by-question breakdown and strengths/weaknesses are only recorded for tests submitted after June 28, 2026. The proctoring integrity log and score breakdown are available below.
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-3">Integrity Log Details</h4>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs text-slate-650 font-semibold">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Integrity Score</span>
                        <span className="text-sm font-bold text-slate-800">{selectedReport.report.integrityScore || 100}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">OS / Device</span>
                        <span className="text-sm font-bold text-slate-800">{selectedReport.report.operatingSystem || 'Unknown'} ({selectedReport.report.deviceType || 'Desktop'})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Browser Specification</span>
                        <span className="text-sm font-bold text-slate-800">{selectedReport.report.browserName || 'Unknown'} {selectedReport.report.browserVersion || ''}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Screen Resolution</span>
                        <span className="text-sm font-bold text-slate-800">{selectedReport.report.screenResolution || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Full Report Details View
                <>
                  {/* Strengths & Weaknesses */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/60">
                      <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Top Strengths
                      </h4>
                      <ul className="space-y-2">
                        {selectedReport.report.strengths?.length > 0 ? selectedReport.report.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5 font-semibold">
                            <span className="text-emerald-500">•</span> {s}
                          </li>
                        )) : <li className="text-xs text-slate-400">No strengths recorded.</li>}
                      </ul>
                    </div>
                    <div className="bg-rose-50/30 p-5 rounded-2xl border border-rose-100/60">
                      <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-2">
                        {selectedReport.report.weaknesses?.length > 0 ? selectedReport.report.weaknesses.map((w, i) => (
                          <li key={i} className="text-xs text-rose-700 flex items-start gap-1.5 font-semibold">
                            <span className="text-rose-500">•</span> {w}
                          </li>
                        )) : <li className="text-xs text-slate-400">No weaknesses recorded.</li>}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/60">
                    <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                      Study Recommendations
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-450 block font-bold uppercase mb-1">Study Guide</span>
                        <p className="text-xs text-indigo-950 font-bold leading-relaxed">{selectedReport.report.suggestedStudyTime || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-450 block font-bold uppercase mb-1">Targeted Suggestions</span>
                        <ul className="space-y-1">
                          {selectedReport.report.suggestions?.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-xs text-indigo-950 font-bold list-disc ml-4">{s}</li>
                          )) || <li className="text-xs text-slate-400 font-bold list-disc">N/A</li>}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Question Review */}
                  <div>
                    <h4 className="text-md font-extrabold text-slate-800 mb-4 tracking-tight">Question-by-Question Review</h4>
                    <div className="space-y-4">
                      {selectedReport.report.questions.map((q, qidx) => (
                        <div key={qidx} className={`p-5 rounded-2xl border ${q.isCorrect ? 'border-emerald-100 bg-emerald-50/15' : 'border-rose-100 bg-rose-50/15'}`}>
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-xs font-black text-slate-400 shrink-0">Q{qidx + 1}.</span>
                            <p className="text-slate-800 font-extrabold text-xs leading-relaxed flex-1">{q.questionText}</p>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0
                              ${q.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}
                            `}>
                              {q.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {q.options?.map((opt, oidx) => (
                              <div
                                key={oidx}
                                className={`p-3 rounded-xl border text-[11px] font-semibold leading-normal ${
                                  oidx === q.correctOptionIndex
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold'
                                    : oidx === q.selectedOptionIndex
                                    ? 'bg-rose-50 border-rose-200 text-rose-800 font-extrabold'
                                    : 'bg-white border-slate-150 text-slate-600'
                                }`}
                              >
                                <span className="font-black mr-1">{String.fromCharCode(65 + oidx)}.</span> {opt}
                              </div>
                            ))}
                          </div>

                          {!q.isCorrect && q.explanation && (
                            <div className="mt-4 p-3.5 bg-indigo-50/50 border border-indigo-100/50 text-indigo-900 text-xs font-semibold rounded-xl leading-relaxed">
                              <span className="font-extrabold text-indigo-950 block mb-1">Reasoning / Explanation:</span>
                              {q.explanation}
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
