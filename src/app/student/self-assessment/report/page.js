'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import SkillGapReportButton from '@/components/SkillGapReportButton';

export default function AssessmentReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!reportId) {
      router.push('/student/self-assessment');
      return;
    }
    fetchReport();
  }, [reportId, router]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/self-assessment/report?id=${reportId}`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'Failed to fetch report');
      setData(json.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!data) return;
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Colors
      const primaryColor = [79, 70, 229]; // Indigo 600
      const secondaryColor = [241, 245, 249]; // Slate 100
      const textColor = [30, 41, 59]; // Slate 800
      const lightTextColor = [100, 116, 139]; // Slate 500
      const successColor = [34, 197, 94]; // Emerald 500
      const dangerColor = [239, 68, 68]; // Red 500

      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('SELF ASSESSMENT REPORT', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`${data.preferredDomain} - ${data.level.charAt(0).toUpperCase() + data.level.slice(1)} Level`, pageWidth / 2, 30, { align: 'center' });

      // Candidate Info Section
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Candidate Profile', 15, 55);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Name: ${data.candidateInfo.name}`, 15, 65);
      doc.text(`Candidate ID: ${data.candidateInfo.candidateId}`, 15, 72);
      doc.text(`Email: ${data.candidateInfo.email}`, 15, 79);
      doc.text(`Date: ${new Date(data.completionDate).toLocaleDateString()}`, 15, 86);

      // Score Summary Box
      const scoreBoxX = pageWidth - 70;
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(scoreBoxX, 50, 55, 40, 3, 3);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Score', scoreBoxX + 27.5, 60, { align: 'center' });
      
      doc.setFontSize(24);
      doc.setTextColor(data.passFail === 'Pass' ? successColor[0] : dangerColor[0], data.passFail === 'Pass' ? successColor[1] : dangerColor[1], data.passFail === 'Pass' ? successColor[2] : dangerColor[2]);
      doc.text(`${data.percentage}%`, scoreBoxX + 27.5, 75, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(data.passFail.toUpperCase(), scoreBoxX + 27.5, 85, { align: 'center' });

      // Topic Performance Table
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Topic-wise Performance', 15, 105);

      const topicData = Object.entries(data.topicPerformance).map(([topic, pct]) => [
        topic,
        `${pct}%`,
        pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Needs Work'
      ]);

      autoTable(doc, {
        startY: 110,
        head: [['Topic', 'Accuracy', 'Rating']],
        body: topicData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { font: 'helvetica', fontSize: 10 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' }
        },
      });

      let finalY = doc.lastAutoTable.finalY + 15;

      // AI Feedback Section
      const addFeedbackSection = (title, items, y) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(title, 15, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
        
        items.forEach(item => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 30);
          doc.text(lines, 15, y);
          y += lines.length * 5 + 2;
        });
        
        return y + 5;
      };

      finalY = addFeedbackSection('Strengths', data.strengths, finalY);
      finalY = addFeedbackSection('Areas for Improvement', data.weaknesses, finalY);
      finalY = addFeedbackSection('Actionable Suggestions', data.suggestions, finalY);

      // Readiness Metrics
      if (finalY > pageHeight - 60) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text('AI Assessment Metrics', 15, finalY);
      
      finalY += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Interview Readiness: ${data.interviewReadiness}/100`, 15, finalY);
      finalY += 8;
      doc.text(`Confidence Level: ${data.confidenceLevel}`, 15, finalY);
      finalY += 8;
      doc.text(`Suggested Study Time: ${data.suggestedStudyTime}`, 15, finalY);
      
      finalY += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Overall Recommendation:', 15, finalY);
      finalY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
      const recLines = doc.splitTextToSize(data.overallRecommendation, pageWidth - 30);
      doc.text(recLines, 15, finalY);

      // Save
      doc.save(`Assessment_Report_${data.candidateInfo.name.replace(/\s+/g, '_')}_${data.level}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', fontWeight: 500 }}>Loading Report...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '32px', maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: '#991b1b', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Unable to Load Report</h3>
          <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
          <button onClick={() => router.back()} style={{ marginTop: '16px', padding: '10px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Header & Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, marginBottom: '8px' }}>
            ← Back to Dashboard
          </button>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Assessment Report</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <SkillGapReportButton studentId={data?.candidateInfo?.studentId} />
          <button 
            onClick={generatePDF}
            disabled={generatingPdf}
            style={{
              padding: '12px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700,
              cursor: generatingPdf ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: generatingPdf ? 0.7 : 1,
              boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
            }}
          >
            {generatingPdf ? 'Generating PDF...' : '📄 Download Result PDF'}
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {/* Report Banner */}
        <div style={{ background: data.passFail === 'Pass' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', padding: '32px', color: 'white', display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', opacity: 0.9, marginBottom: '4px' }}>
              {data.preferredDomain} • {data.level} Level
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>
              {data.passFail === 'Pass' ? 'Assessment Passed!' : 'Assessment Failed'}
            </h2>
            <p style={{ opacity: 0.9, marginTop: '8px', fontSize: '15px' }}>
              Attempt #{data.attemptNumber} • {new Date(data.completionDate).toLocaleString()}
            </p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px 32px', borderRadius: '16px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>Score</div>
            <div style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>{data.percentage}%</div>
            <div style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9, marginTop: '4px' }}>
              {data.correctCount} / {data.totalQuestions} Correct
            </div>
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            <MetricCard title="Interview Readiness" value={`${data.interviewReadiness}/100`} desc="AI calculated score" icon="🎯" color="#8b5cf6" bg="#f3e8ff" />
            <MetricCard title="Confidence Level" value={data.confidenceLevel} desc="Based on accuracy" icon="🧠" color="#3b82f6" bg="#dbeafe" />
            <MetricCard title="Suggested Study Time" value={data.suggestedStudyTime} desc="For next level/retake" icon="⏱️" color="#f59e0b" bg="#fef3c7" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', md: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
            {/* Topic Performance */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📊</span> Topic Performance
              </h3>
              <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                {Object.entries(data.topicPerformance).map(([topic, pct], i) => (
                  <div key={i} style={{ marginBottom: i !== Object.keys(data.topicPerformance).length - 1 ? '16px' : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>
                      <span style={{ color: '#334155' }}>{topic}</span>
                      <span style={{ color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }}>{pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendation */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🤖</span> Overall Recommendation
              </h3>
              <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '16px', border: '1px solid #bae6fd', padding: '24px', color: '#0369a1', lineHeight: '1.6', fontSize: '15px', fontWeight: 500 }}>
                "{data.overallRecommendation}"
              </div>
            </div>
          </div>

          {/* Feedback Lists */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            <FeedbackList title="Key Strengths" icon="💪" items={data.strengths} color="#10b981" bg="#ecfdf5" />
            <FeedbackList title="Areas for Improvement" icon="📈" items={data.weaknesses} color="#ef4444" bg="#fef2f2" />
            <FeedbackList title="Actionable Suggestions" icon="💡" items={data.suggestions} color="#8b5cf6" bg="#f3e8ff" />

          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, desc, icon, color, bg }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', background: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
        {icon}
      </div>
      <div>
        <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ color: color, fontSize: '18px', fontWeight: 800, margin: '2px 0' }}>{value}</div>
        <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>{desc}</div>
      </div>
    </div>
  );
}

function FeedbackList({ title, icon, items, color, bg }) {
  if (!items || items.length === 0) return null;
  
  return (
    <div style={{ background: bg, borderRadius: '16px', border: `1px solid ${color}30`, padding: '24px' }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, color: color, margin: '0 0 16px 0' }}>
        {icon} {title}
      </h4>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
            <span style={{ color: color, marginTop: '2px' }}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
