'use client';

import { useState, useEffect } from 'react';

export default function CollegeAssessmentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/college/assessments');
      const data = await res.json();
      if (data.success) {
        setReports(data.assessments || []);
      }
    } catch (err) {
      console.error('Failed to fetch assessment reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setSelectedReport(null);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Student Assessment Reports</h2>
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">Student Assessment Reports</h2>
      </div>

      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">College Name</th>
              <th className="px-4 py-3">Domain / Track</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Completed On</th>
              <th className="px-4 py-3 text-right">Report</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center p-8 text-slate-500 font-medium">
                  No assessment reports available.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-800">{report.studentName}</td>
                  <td className="px-4 py-3 text-slate-600">{report.studentEmail}</td>
                  <td className="px-4 py-3 text-slate-600">{report.collegeName}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{report.preferredDomain}</div>
                    <div className="text-xs text-slate-500">{report.industryTrack}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${report.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-black text-slate-800">{report.percentage || 0}%</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(report.completionDate).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => setSelectedReport(report)}
                      className="px-3 py-1.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Assessment Report</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedReport.studentName} - {selectedReport.preferredDomain}</p>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-white flex-1 space-y-8">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">Score</p>
                  <p className="text-2xl font-black text-indigo-900">{selectedReport.percentage || 0}%</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Status</p>
                  <p className="text-2xl font-black text-emerald-900 capitalize">{selectedReport.status}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Readiness</p>
                  <p className="text-2xl font-black text-blue-900">{selectedReport.interviewReadiness || 0}/100</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Time Taken</p>
                  <p className="text-2xl font-black text-purple-900">{Math.floor((selectedReport.timeTaken || 0) / 60)}m {(selectedReport.timeTaken || 0) % 60}s</p>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Top Strengths
                  </h4>
                  <ul className="space-y-2">
                    {selectedReport.strengths?.length > 0 ? selectedReport.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span> {s}
                      </li>
                    )) : <li className="text-sm text-emerald-600/70">No strengths recorded.</li>}
                  </ul>
                </div>
                <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-100">
                  <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {selectedReport.weaknesses?.length > 0 ? selectedReport.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-rose-700 flex items-start gap-2">
                        <span className="text-rose-500 mt-0.5">•</span> {w}
                      </li>
                    )) : <li className="text-sm text-rose-600/70">No weaknesses recorded.</li>}
                  </ul>
                </div>
              </div>

              {/* Detailed Questions */}
              {selectedReport.questions && selectedReport.questions.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Question Breakdown</h4>
                  <div className="space-y-4">
                    {selectedReport.questions.map((q, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border ${q.isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-semibold text-slate-800"><span className="text-slate-500 mr-2">Q{idx + 1}.</span> {q.questionText}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ml-2 ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {q.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 mt-3">
                          {q.options?.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-2 rounded text-xs border ${
                              oIdx === q.correctOptionIndex ? 'bg-emerald-100 border-emerald-300 font-bold text-emerald-800' : 
                              oIdx === q.selectedOptionIndex ? 'bg-rose-100 border-rose-300 font-bold text-rose-800' : 
                              'bg-white border-slate-200 text-slate-600'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                        {!q.isCorrect && q.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                            <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
