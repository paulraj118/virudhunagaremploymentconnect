'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ─── PDF Generation Helper ───────────────────────────────────────────────────
function generatePDF(report) {
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then(() => {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 15;

      const addPageIfNeeded = (needed = 30) => {
        if (y + needed > doc.internal.pageSize.getHeight() - 15) {
          doc.addPage();
          y = 15;
        }
      };

      // ── Header ──
      doc.setFillColor(67, 56, 202); // indigo-700
      doc.rect(0, 0, pageWidth, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Assessment Report', pageWidth / 2, 14, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Virudhunagar Employment Connect', pageWidth / 2, 22, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, 28, { align: 'center' });
      y = 40;
      doc.setTextColor(30, 41, 59); // slate-800

      // ── Candidate Details ──
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Candidate Details', 14, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const candidateDetails = [
        ['Name', report.candidateName],
        ['Email', report.candidateEmail],
        ['College', report.collegeName],
        ['Department', report.department],
      ];
      candidateDetails.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}: `, 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value || 'N/A', 50, y);
        y += 6;
      });
      y += 4;

      // ── Assessment Summary ──
      addPageIfNeeded(50);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Assessment Summary', 14, y);
      y += 7;
      doc.setFontSize(10);

      const attempted = (report.questions || []).filter(q => q.selectedOptionIndex !== -1).length;
      const unanswered = report.totalQuestions - attempted;
      const incorrect = attempted - report.correctAnswers;

      const summaryData = [
        ['Job Title', report.jobTitle || 'Self Assessment'],
        ['Company', report.companyName || 'N/A'],
        ['Domain', report.domain],
        ['Assessment Date', report.submissionTimestamp ? new Date(report.submissionTimestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'],
        ['Total Questions', String(report.totalQuestions)],
        ['Attempted', String(attempted)],
        ['Correct Answers', String(report.correctAnswers)],
        ['Incorrect Answers', String(incorrect)],
        ['Unanswered', String(unanswered)],
        ['Score', String(report.score)],
        ['Percentage', `${report.percentage}%`],
        ['Result', report.passFail],
      ];
      summaryData.forEach(([label, value]) => {
        addPageIfNeeded(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}: `, 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 60, y);
        y += 6;
      });
      y += 6;

      // ── Performance Analysis ──
      addPageIfNeeded(40);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Analysis', 14, y);
      y += 8;

      if (report.strengths && report.strengths.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Strong Areas:', 14, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        report.strengths.forEach(s => {
          addPageIfNeeded(8);
          doc.text(`• ${s}`, 18, y);
          y += 6;
        });
        y += 3;
      }

      if (report.weaknesses && report.weaknesses.length > 0) {
        addPageIfNeeded(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Weak Areas:', 14, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        report.weaknesses.forEach(w => {
          addPageIfNeeded(8);
          doc.text(`• ${w}`, 18, y);
          y += 6;
        });
        y += 3;
      }

      if (report.suggestions && report.suggestions.length > 0) {
        addPageIfNeeded(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Suggestions:', 14, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        report.suggestions.forEach(s => {
          addPageIfNeeded(8);
          const lines = doc.splitTextToSize(`• ${s}`, pageWidth - 32);
          lines.forEach(line => {
            addPageIfNeeded(6);
            doc.text(line, 18, y);
            y += 5;
          });
          y += 1;
        });
        y += 3;
      }

      // Recommendations
      const recommendations = getRecommendations(report.percentage);
      if (recommendations.length > 0) {
        addPageIfNeeded(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommendations:', 14, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        recommendations.forEach(r => {
          addPageIfNeeded(8);
          doc.text(`• ${r}`, 18, y);
          y += 6;
        });
        y += 3;
      }

      // ── Question Review Table ──
      if (report.questions && report.questions.length > 0) {
        addPageIfNeeded(20);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Question Review', 14, y);
        y += 8;

        report.questions.forEach((q, idx) => {
          addPageIfNeeded(45);

          // Question header
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          const qLines = doc.splitTextToSize(`Q${idx + 1}. ${q.questionText || 'N/A'}`, pageWidth - 28);
          qLines.forEach(line => {
            addPageIfNeeded(6);
            doc.text(line, 14, y);
            y += 5;
          });
          y += 2;

          // Options
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const optionLabels = ['A', 'B', 'C', 'D'];
          (q.options || []).forEach((opt, oi) => {
            addPageIfNeeded(7);
            const isSelected = oi === q.selectedOptionIndex;
            const isCorrect = oi === q.correctOptionIndex;
            let prefix = '  ';
            if (isCorrect && isSelected) prefix = '✓ ';
            else if (isSelected) prefix = '✗ ';
            else if (isCorrect) prefix = '✓ ';

            const optText = `${prefix}${optionLabels[oi]}. ${opt}`;
            const optLines = doc.splitTextToSize(optText, pageWidth - 36);

            if (isCorrect) doc.setTextColor(22, 163, 74); // green
            else if (isSelected) doc.setTextColor(220, 38, 38); // red
            else doc.setTextColor(100, 116, 139); // slate-500

            optLines.forEach(line => {
              addPageIfNeeded(5);
              doc.text(line, 20, y);
              y += 5;
            });
            doc.setTextColor(30, 41, 59);
          });

          // Status
          y += 2;
          doc.setFontSize(9);
          const status = q.selectedOptionIndex === -1 ? '⚪ Not Answered' : q.isCorrect ? '✅ Correct' : '❌ Incorrect';
          doc.text(`Status: ${status}`, 14, y);
          y += 4;

          if (q.explanation) {
            addPageIfNeeded(10);
            doc.setFont('helvetica', 'italic');
            const expLines = doc.splitTextToSize(`Explanation: ${q.explanation}`, pageWidth - 32);
            expLines.forEach(line => {
              addPageIfNeeded(5);
              doc.text(line, 18, y);
              y += 5;
            });
            doc.setFont('helvetica', 'normal');
          }

          y += 5;
        });
      }

      // ── Final Score Footer ──
      addPageIfNeeded(25);
      doc.setDrawColor(67, 56, 202);
      doc.setLineWidth(0.5);
      doc.line(14, y, pageWidth - 14, y);
      y += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Final Score: ${report.score} / ${report.totalQuestions * 5}   |   Percentage: ${report.percentage}%   |   Result: ${report.passFail}`, pageWidth / 2, y, { align: 'center' });

      // Save
      const fileName = `Assessment_Report_${report.candidateName?.replace(/\s+/g, '_') || 'Candidate'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    });
  });
}

// ─── Recommendations Generator (client-side, no backend changes) ─────────────
function getRecommendations(percentage) {
  if (percentage >= 90) {
    return [
      'Excellent performance — continue with advanced problem solving.',
      'Explore system design and architecture topics.',
      'Consider mentoring peers to solidify your knowledge.',
      'Participate in hackathons and open-source contributions.',
    ];
  } else if (percentage >= 70) {
    return [
      'Practice coding problems daily on competitive platforms.',
      'Improve debugging skills with real-world projects.',
      'Focus on technical interview preparation.',
      'Attempt more mock assessments to build confidence.',
    ];
  } else if (percentage >= 50) {
    return [
      'Revise fundamental concepts thoroughly.',
      'Practice coding problems daily.',
      'Focus on weak areas identified in this report.',
      'Watch structured tutorials and take notes.',
      'Attempt more mock assessments regularly.',
    ];
  } else {
    return [
      'Build a strong foundation in core concepts.',
      'Follow structured learning paths for your domain.',
      'Practice basic problems before moving to advanced topics.',
      'Dedicate consistent daily study time.',
      'Seek mentorship or join study groups.',
      'Revisit fundamental concepts and official documentation.',
    ];
  }
}

// ─── Circular Progress Component ─────────────────────────────────────────────
function CircularProgress({ percentage, size = 120, strokeWidth = 10, passFail }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = passFail === 'Pass' ? '#16a34a' : percentage >= 50 ? '#f59e0b' : '#dc2626';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-slate-800">{percentage}%</span>
        <span className={`text-xs font-bold ${passFail === 'Pass' ? 'text-emerald-600' : 'text-red-500'}`}>
          {passFail}
        </span>
      </div>
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN REPORT PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AssessmentReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchReport();
  }, [id]);

  async function fetchReport() {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/student/assessment-report/${id}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.message || 'Failed to load report');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while loading the report.');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading assessment report...</p>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <p className="text-slate-700 font-semibold text-lg">Unable to load report</p>
        <p className="text-slate-500 text-sm">{error}</p>
        <button
          onClick={() => router.push('/student/applications')}
          className="mt-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
        >
          ← Back to Applications
        </button>
      </div>
    );
  }

  if (!report) return null;

  // ── Computed Values ──
  const attempted = (report.questions || []).filter(q => q.selectedOptionIndex !== -1).length;
  const unanswered = report.totalQuestions - attempted;
  const incorrect = attempted - report.correctAnswers;
  const recommendations = getRecommendations(report.percentage);

  return (
    <div className="max-w-5xl mx-auto pb-12">

      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => router.push('/student/applications')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-semibold mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to My Applications
          </button>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Assessment Report
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {report.jobTitle !== 'Self Assessment' ? report.jobTitle : report.domain} — {report.companyName !== 'N/A' ? report.companyName : 'Self Assessment'}
          </p>
        </div>
        <button
          onClick={() => generatePDF(report)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Download Report
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Assessment Summary
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          Assessment Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left — Details */}
          <div className="md:col-span-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['Candidate Name', report.candidateName],
                ['Job Title', report.jobTitle || 'Self Assessment'],
                ['Company', report.companyName !== 'N/A' ? report.companyName : '—'],
                ['Domain', report.domain],
                ['Assessment Date', report.submissionTimestamp
                  ? new Date(report.submissionTimestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'N/A'],
                ['Assessment Time', report.submissionTimestamp
                  ? new Date(report.submissionTimestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                  <span className="text-sm font-bold text-slate-700 mt-0.5">{value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 mt-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['Total Questions', report.totalQuestions],
                  ['Attempted', attempted],
                  ['Correct', report.correctAnswers],
                  ['Incorrect', incorrect],
                  ['Unanswered', unanswered],
                  ['Score', report.score],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                    <span className="text-lg font-black text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Circular Progress */}
          <div className="flex flex-col items-center justify-center">
            <CircularProgress percentage={report.percentage} passFail={report.passFail} />
            <div className={`mt-3 px-4 py-1.5 rounded-full text-xs font-bold ${report.passFail === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              {report.passFail === 'Pass' ? '✅ Passed' : '❌ Failed'}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Performance Statistics Cards
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Total"
          value={report.totalQuestions}
          color="bg-indigo-100 text-indigo-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>}
        />
        <StatCard
          label="Correct"
          value={report.correctAnswers}
          color="bg-emerald-100 text-emerald-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
        />
        <StatCard
          label="Incorrect"
          value={incorrect}
          color="bg-red-100 text-red-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>}
        />
        <StatCard
          label="Skipped"
          value={unanswered}
          color="bg-slate-100 text-slate-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"></path></svg>}
        />
        <StatCard
          label="Percentage"
          value={`${report.percentage}%`}
          color="bg-amber-100 text-amber-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>}
        />
        <StatCard
          label="Result"
          value={report.passFail}
          color={report.passFail === 'Pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}
          icon={report.passFail === 'Pass'
            ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          }
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Performance Analysis
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          Performance Analysis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strong Areas */}
          {report.strengths && report.strengths.length > 0 && (
            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                Strong Areas
              </h3>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">●</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weak Areas */}
          {report.weaknesses && report.weaknesses.length > 0 && (
            <div className="bg-red-50 rounded-xl p-5 border border-red-100">
              <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
                Weak Areas
              </h3>
              <ul className="space-y-2">
                {report.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">●</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {report.suggestions && report.suggestions.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                Suggestions
              </h3>
              <ul className="space-y-2">
                {report.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">●</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Recommendations
            </h3>
            <ul className="space-y-2">
              {recommendations.map((r, i) => (
                <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">●</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Extra Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {report.confidenceLevel && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase">Confidence Level</p>
              <p className="text-lg font-black text-slate-700 mt-1">{report.confidenceLevel}</p>
            </div>
          )}
          {report.interviewReadiness > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase">Interview Readiness</p>
              <p className="text-lg font-black text-slate-700 mt-1">{report.interviewReadiness}%</p>
            </div>
          )}
          {report.suggestedStudyTime && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase">Study Time</p>
              <p className="text-sm font-bold text-slate-700 mt-1">{report.suggestedStudyTime}</p>
            </div>
          )}
        </div>
      </div>



      {/* ── Bottom Download Button ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <button
          onClick={() => generatePDF(report)}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Download Report as PDF
        </button>
        <button
          onClick={() => router.push('/student/applications')}
          className="flex items-center gap-2 px-8 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
        >
          ← Back to Applications
        </button>
      </div>
    </div>
  );
}
