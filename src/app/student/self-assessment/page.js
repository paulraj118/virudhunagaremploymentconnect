'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MASTER_DOMAINS } from '@/lib/domainConstants';

export default function SelfAssessmentPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');

  // Self Assessment Profile Form states
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [currentYear, setCurrentYear] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch('/api/student/self-assessment');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load data');
      setData(json);
      if (json.student?.preferredDomain) {
        setSelectedDomain(json.student.preferredDomain);
      }
      if (json.student) {
        if (!json.student.selfAssessmentProfileCompleted) {
          setShowProfileForm(true);
        }
        setCurrentYear(json.student.currentYear || '');
        setCgpa(json.student.cgpa || '');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleProjectsCountChange = (count) => {
    const num = Math.min(10, Math.max(0, parseInt(count) || 0));
    setNumProjects(num);
    setProjectTitles(prev => {
      const next = [...prev];
      while (next.length < num) next.push('');
      return next.slice(0, num);
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      const payload = {
        currentYear,
        cgpa
      };
      
      const res = await fetch('/api/student/self-assessment/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setData(prev => ({
          ...prev,
          student: {
            ...prev.student,
            ...data.student,
            selfAssessmentProfileCompleted: true
          }
        }));
        setShowProfileForm(false);
      } else {
        alert(data.error || 'Failed to save profile');
      }
    } catch(err) {
      alert('Failed to save profile');
    } finally {
      setProfileSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', fontWeight: 500 }}>Loading Self Assessment...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '32px', maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: '#991b1b', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Unable to Load</h3>
          <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
          <button onClick={fetchData} style={{ marginTop: '16px', padding: '10px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (showProfileForm) {
    const isEditMode = data?.student?.selfAssessmentProfileCompleted;
    const coreDetails = data?.student || {};

    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {isEditMode ? 'Edit Assessment Profile' : 'Self Assessment Profile Details'}
              </h2>
              <p className="text-slate-500 text-sm">
                Provide your details to customize your technical assessment and generated review reports.
              </p>
            </div>
            {isEditMode && (
              <button 
                onClick={() => setShowProfileForm(false)}
                className="text-slate-400 hover:text-slate-650 transition-colors p-1.5 rounded-full hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            
            {/* Read-only Core Information */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-2">
                Core Profile Details (Pre-filled from Enrollment)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Candidate Name</span>
                  <span className="text-slate-800 mt-0.5 block">{coreDetails.name || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Email Address</span>
                  <span className="text-slate-800 mt-0.5 block">{coreDetails.email || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">College Name</span>
                  <span className="text-slate-800 mt-0.5 block">{coreDetails.collegeName || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Degree / Department</span>
                  <span className="text-slate-800 mt-0.5 block">{coreDetails.degree || '—'} / {coreDetails.department || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Industry Track</span>
                  <span className="text-slate-800 mt-0.5 block">{coreDetails.industryTrack || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Preferred Domain</span>
                  <span className="text-slate-800 mt-0.5 block">{coreDetails.preferredDomain || '—'}</span>
                </div>
              </div>
            </div>

            {/* Academic Details removed */}

            {/* Form actions */}
            <div className="flex gap-4 pt-6 border-t mt-8">
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => setShowProfileForm(false)}
                  className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={profileSubmitting}
                className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {profileSubmitting ? 'Saving...' : 'Continue to Assessment →'}
              </button>
            </div>

          </form>
        </div>
        <style jsx>{`
          @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  const { student, completedLevels, unlockedLevels, latestScores = {}, analytics, history, availableDomains } = data;
  const isDomainAvailable = selectedDomain && availableDomains?.includes(selectedDomain);

  const levelConfig = [
    {
      key: 'low',
      name: 'Low',
      title: 'Foundation Level',
      description: 'Basic concepts and fundamentals. Tests your foundational understanding of core topics.',
      icon: '🟢',
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      borderColor: '#6ee7b7',
      questions: 20,
      time: '20 min',
    },
    {
      key: 'medium',
      name: 'Medium',
      title: 'Intermediate Level',
      description: 'Applied knowledge and problem-solving. Tests your ability to apply concepts in scenarios.',
      icon: '🟡',
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      borderColor: '#fcd34d',
      questions: 20,
      time: '20 min',
    },
    {
      key: 'high',
      name: 'High',
      title: 'Advanced Level',
      description: 'Expert-level concepts and critical thinking. Tests deep understanding and advanced applications.',
      icon: '🔴',
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
      borderColor: '#fca5a5',
      questions: 20,
      time: '20 min',
    },
  ];

  function formatTime(seconds) {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  const handleContinue = () => {
    if (!student.industryTrack) {
      setValidationError('Please complete your Professional Details before starting the assessment.');
      return;
    }
    if (!student.preferredDomain) {
      setValidationError('Please select your Preferred Domain to continue.');
      return;
    }
    setShowDashboard(true);
  };

  if (!showDashboard) {
    const isMissingDetails = !student.industryTrack || !student.preferredDomain;

    if (isMissingDetails) {
      return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ color: '#991b1b', fontWeight: 700, fontSize: '20px', marginBottom: '12px' }}>Incomplete Profile</h3>
            <p style={{ color: '#dc2626', fontSize: '15px', marginBottom: '32px', lineHeight: '1.5' }}>
              Your Professional Details are incomplete. Please complete Student Enrollment before taking the assessment.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => router.push('/student/profile')}
                style={{ padding: '12px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
              >
                Go to Student Enrollment
              </button>
              <button 
                onClick={() => router.push('/student')}
                style={{ padding: '12px 24px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', color: '#1e293b' }}>
        
        {/* HERO SECTION */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', borderRadius: '24px', padding: '48px 32px', color: 'white', marginBottom: '32px', textAlign: 'center', boxShadow: '0 10px 25px rgba(67, 56, 202, 0.2)' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Welcome to Self Assessment
          </h1>
          <p style={{ fontSize: '16px', color: '#e0e7ff', maxWidth: '700px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
            Evaluate your technical skills based on your selected Industry Track and Preferred Domain. Complete assessments to measure your interview readiness and identify areas for improvement.
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            {[
              { label: 'Assessment Levels', value: '3', icon: '📊' },
              { label: 'Questions per Level', value: '20', icon: '📝' },
              { label: 'Time per Assessment', value: '20 Mins', icon: '⏱️' },
              { label: 'AI Feedback', value: 'Enabled', icon: '🤖' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)', minWidth: '160px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: '#c7d2fe', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE SECTION: PROFILE & BENEFITS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          
          {/* PROFILE SUMMARY */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '10px', fontSize: '18px' }}>👤</span>
              Candidate Profile
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '20px', color: '#64748b', width: '24px', textAlign: 'center' }}>🧑‍🎓</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Candidate Name</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{student.name || '—'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '20px', color: '#64748b', width: '24px', textAlign: 'center' }}>📧</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Email</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{student.email || '—'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '20px', color: '#64748b', width: '24px', textAlign: 'center' }}>🏢</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Industry Track</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{student.industryTrack}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '20px', color: '#64748b', width: '24px', textAlign: 'center' }}>🎯</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Preferred Domain</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{student.preferredDomain}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RULES */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '10px', fontSize: '18px' }}>📜</span>
              Self Assessment Rules
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              <div>
                <strong style={{ color: '#1e293b' }}>1. Level Progression:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '6px', listStyleType: 'disc' }}>
                  <li><span style={{ fontWeight: 650 }}>Fundamental Level:</span> Always unlocked. Attempt unlimited times.</li>
                  <li><span style={{ fontWeight: 650 }}>Intermediate Level:</span> Unlocks after scoring <strong style={{ color: '#4f46e5' }}>70% or above</strong> in Fundamental Level.</li>
                  <li><span style={{ fontWeight: 650 }}>High Level:</span> Unlocks after scoring <strong style={{ color: '#4f46e5' }}>70% or above</strong> in Intermediate Level.</li>
                </ul>
              </div>
              
              <div>
                <strong style={{ color: '#1e293b' }}>2. Retake Policy:</strong>
                <p style={{ marginTop: '4px' }}>All levels allow unlimited attempts to improve your score.</p>
              </div>
              
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #4f46e5' }}>
                <span style={{ fontWeight: 700, color: '#1e293b', display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>⚠️ Important Note:</span>
                Your eligibility for unlocking the next level is determined solely by your <strong style={{ color: '#1e293b' }}>latest completed attempt</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* ASSESSMENT PROCESS */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px 32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '32px', textAlign: 'center' }}>
            Assessment Process
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', margin: '0 auto', maxWidth: '800px' }}>
            {/* Background Line */}
            <div style={{ position: 'absolute', top: '24px', left: '40px', right: '40px', height: '2px', background: '#e2e8f0', zIndex: 0 }} />
            
            {[
              { num: 1, label: 'Professional Details', active: true },
              { num: 2, label: 'Choose Level', active: false },
              { num: 3, label: 'Take Assessment', active: false },
              { num: 4, label: 'AI Feedback', active: false },
              { num: 5, label: 'Download Report', active: false }
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1, flex: 1, minWidth: '100px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: step.active ? '#4f46e5' : 'white', border: `2px solid ${step.active ? '#4f46e5' : '#cbd5e1'}`, color: step.active ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', boxShadow: step.active ? '0 0 0 4px rgba(79, 70, 229, 0.1)' : 'none' }}>
                  {step.num}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: step.active ? '#1e293b' : '#64748b', textAlign: 'center' }}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* READY TO BEGIN */}
        <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '20px', padding: '40px 32px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            Ready to Begin?
          </h2>
          <p style={{ fontSize: '15px', color: '#475569', marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
            Your assessment questions will be generated based on your selected Preferred Domain. Choose a domain below to continue.
          </p>
          
          <div style={{ marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px auto' }}>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', 
                fontSize: '15px', fontWeight: 500, color: '#1e293b', outline: 'none', 
                background: 'white', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <option value="" disabled>Select your Preferred Domain</option>
              {MASTER_DOMAINS.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
            {!isDomainAvailable && selectedDomain && (
              <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '12px', fontWeight: 500 }}>
                Questions are not yet available for this domain.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={handleContinue}
              disabled={!isDomainAvailable}
              style={{ 
                padding: '14px 32px', background: isDomainAvailable ? '#4f46e5' : '#94a3b8', color: 'white', 
                border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', 
                cursor: isDomainAvailable ? 'pointer' : 'not-allowed', transition: 'all 0.2s', 
                boxShadow: isDomainAvailable ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none' 
              }}
              onMouseOver={(e) => { if (isDomainAvailable) { e.target.style.background = '#4338ca'; e.target.style.transform = 'translateY(-2px)'; } }}
              onMouseOut={(e) => { if (isDomainAvailable) { e.target.style.background = '#4f46e5'; e.target.style.transform = 'none'; } }}
            >
              Proceed to Assessment →
            </button>
            <button 
              onClick={() => router.push('/student')}
              style={{ padding: '14px 32px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 600, fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.target.style.background = '#f8fafc'; }}
              onMouseOut={(e) => { e.target.style.background = 'white'; }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px', margin: 0 }}>
          Self Assessment
        </h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
          Test your knowledge, track progress, and prepare for interviews
        </p>
      </div>

      {/* Student Info Card */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>🎓</span>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{student.name}</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '12px', fontSize: '13px', opacity: 0.9 }}>
            <div><span style={{ fontWeight: 600 }}>Industry Track:</span> {student.industryTrack || 'Not set'}</div>
            <div><span style={{ fontWeight: 600 }}>Preferred Domain:</span> {student.preferredDomain || 'Not set'}</div>
            <div><span style={{ fontWeight: 600 }}>Candidate ID:</span> {student.candidateId || '—'}</div>
          </div>
        </div>
        <button 
          onClick={() => setShowProfileForm(true)}
          style={{
            padding: '10px 20px', background: 'rgba(255, 255, 255, 0.15)', color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.25)', borderRadius: '10px', 
            fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseOver={e => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
          onMouseOut={e => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
        >
          ✏️ Edit Assessment Profile
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Assessments', value: analytics.totalAssessments, icon: '📊', color: '#6366f1' },
          { label: 'Highest Score', value: `${analytics.highestScore}%`, icon: '🏆', color: '#f59e0b' },
          { label: 'Average Score', value: `${analytics.averageScore}%`, icon: '📈', color: '#10b981' },
          { label: 'Completed Levels', value: `${analytics.completedLevelCount}/3`, icon: '✅', color: '#22c55e' },
          { label: 'Pending Levels', value: analytics.pendingLevelCount, icon: '⏳', color: '#f97316' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress Status */}
      <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Assessment Status & Path
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
          {/* Step 1: Fundamental */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{completedLevels.low ? '✅' : '🎯'}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                Fundamental {completedLevels.low ? 'Completed' : 'Current Stage'}
              </div>
              {latestScores.low !== null && (
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                  Latest Score: {latestScores.low}%
                </div>
              )}
            </div>
          </div>
          
          {/* Connector */}
          <div style={{ flex: 1, minWidth: '30px', height: '2px', background: completedLevels.low ? '#10b981' : '#cbd5e1' }} />
          
          {/* Step 2: Intermediate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: unlockedLevels.medium ? 1 : 0.6 }}>
            <span style={{ fontSize: '20px' }}>
              {completedLevels.medium ? '✅' : unlockedLevels.medium ? '🔓' : '🔒'}
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                Intermediate {completedLevels.medium ? 'Completed' : unlockedLevels.medium ? 'Unlocked' : 'Locked'}
              </div>
              {latestScores.medium !== null && (
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                  Latest Score: {latestScores.medium}%
                </div>
              )}
            </div>
          </div>
          
          {/* Connector */}
          <div style={{ flex: 1, minWidth: '30px', height: '2px', background: completedLevels.medium ? '#10b981' : '#cbd5e1' }} />
          
          {/* Step 3: High */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: unlockedLevels.high ? 1 : 0.6 }}>
            <span style={{ fontSize: '20px' }}>
              {completedLevels.high ? '✅' : unlockedLevels.high ? '🔓' : '🔒'}
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                High {completedLevels.high ? 'Completed' : unlockedLevels.high ? 'Unlocked' : 'Locked'}
              </div>
              {latestScores.high !== null && (
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                  Latest Score: {latestScores.high}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Level Cards */}
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
        Assessment Levels
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {levelConfig.map((lvl) => {
          const isUnlocked = unlockedLevels[lvl.key];
          const isCompleted = completedLevels[lvl.key];
          const levelProgress = analytics.levelWiseProgress?.[lvl.key];

          return (
            <div key={lvl.key} style={{
              background: isUnlocked ? lvl.bgGradient : '#f8fafc',
              borderRadius: '16px',
              border: `2px solid ${isUnlocked ? lvl.borderColor : '#e2e8f0'}`,
              padding: '28px',
              position: 'relative',
              opacity: isUnlocked ? 1 : 0.7,
              transition: 'all 0.3s',
              overflow: 'hidden',
            }}>
              {/* Lock overlay */}
              {!isUnlocked && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(248, 250, 252, 0.5)', backdropFilter: 'blur(2px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2, borderRadius: '14px',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔒</div>
                    <p style={{ color: '#64748b', fontWeight: 600, fontSize: '14px', padding: '0 16px' }}>
                      {lvl.key === 'medium' 
                        ? 'Score at least 70% in Fundamental to unlock.' 
                        : 'Score at least 70% in Intermediate to unlock.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Completion badge */}
              {isCompleted && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#22c55e', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', zIndex: 1 }}>
                  ✓ PASSED
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '28px' }}>{lvl.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{lvl.title}</h3>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{lvl.questions} Questions • {lvl.time}</span>
                </div>
              </div>

              <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                {lvl.description}
              </p>

              {/* Level-specific stats */}
              {levelProgress && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px' }}>
                  <div><span style={{ fontWeight: 600, color: '#475569' }}>Best:</span> <span style={{ color: lvl.color, fontWeight: 700 }}>{levelProgress.bestPercentage}%</span></div>
                  {latestScores?.[lvl.key] !== undefined && latestScores[lvl.key] !== null && (
                    <div><span style={{ fontWeight: 600, color: '#475569' }}>Latest Score:</span> <span style={{ color: lvl.color, fontWeight: 700 }}>{latestScores[lvl.key]}%</span></div>
                  )}
                  <div><span style={{ fontWeight: 600, color: '#475569' }}>Attempts:</span> {levelProgress.attempts}</div>
                </div>
              )}

              {isUnlocked && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => router.push(`/student/self-assessment/take?level=${lvl.key}&domain=${encodeURIComponent(selectedDomain)}`)}
                    disabled={!isDomainAvailable}
                    style={{
                      padding: '10px 20px', background: isDomainAvailable ? lvl.color : '#cbd5e1', color: 'white',
                      border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                      cursor: isDomainAvailable ? 'pointer' : 'not-allowed', transition: 'all 0.2s', flex: 1,
                    }}
                    onMouseOver={(e) => { if(isDomainAvailable) e.target.style.opacity = '0.9'; }}
                    onMouseOut={(e) => { if(isDomainAvailable) e.target.style.opacity = '1'; }}
                  >
                    {isCompleted ? '↻ Retake Assessment' : '▶ Start Assessment'}
                  </button>
                  {isCompleted && levelProgress && (
                    <button
                      onClick={() => {
                        const latestResult = history.find(h => h.level === lvl.key);
                        if (latestResult) router.push(`/student/self-assessment/report?id=${latestResult._id}`);
                      }}
                      style={{
                        padding: '10px 16px', background: 'white', color: lvl.color,
                        border: `2px solid ${lvl.color}`, borderRadius: '10px', fontWeight: 700,
                        fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      📄 View Report
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Performance Trend */}
      {analytics.performanceTrend && analytics.performanceTrend.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
            Performance Trend
          </h2>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', padding: '0 4px' }}>
              {analytics.performanceTrend.map((point, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: point.percentage >= 70 ? '#22c55e' : '#ef4444' }}>
                    {point.percentage}%
                  </span>
                  <div style={{
                    width: '100%', maxWidth: '40px',
                    height: `${Math.max(point.percentage * 1.2, 10)}px`,
                    background: point.percentage >= 70
                      ? 'linear-gradient(to top, #22c55e, #4ade80)'
                      : 'linear-gradient(to top, #ef4444, #f87171)',
                    borderRadius: '6px 6px 2px 2px',
                    transition: 'height 0.5s ease',
                  }} />
                  <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'capitalize' }}>
                    {point.level?.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assessment History */}
      {history && history.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
            Assessment History
          </h2>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Level</th>
                    <th style={thStyle}>Score</th>
                    <th style={thStyle}>Percentage</th>
                    <th style={thStyle}>Result</th>
                    <th style={thStyle}>Time</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{formatDate(item.completionDate)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                          textTransform: 'capitalize',
                          background: item.level === 'low' ? '#ecfdf5' : item.level === 'medium' ? '#fffbeb' : '#fef2f2',
                          color: item.level === 'low' ? '#059669' : item.level === 'medium' ? '#d97706' : '#dc2626',
                        }}>
                          {item.level}
                        </span>
                      </td>
                      <td style={tdStyle}>{item.correctCount}/{item.totalQuestions}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: item.percentage >= 70 ? '#22c55e' : '#ef4444' }}>
                          {item.percentage}%
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                          background: item.passFail === 'Pass' ? '#dcfce7' : '#fef2f2',
                          color: item.passFail === 'Pass' ? '#16a34a' : '#dc2626',
                        }}>
                          {item.passFail}
                        </span>
                      </td>
                      <td style={tdStyle}>{formatTime(item.timeTaken)}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => router.push(`/student/self-assessment/report?id=${item._id}`)}
                          style={{
                            padding: '5px 12px', background: '#f0f0ff', color: '#6366f1',
                            border: '1px solid #c7d2fe', borderRadius: '8px', fontSize: '12px',
                            fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!history || history.length === 0) && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ color: '#1e293b', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>No Assessments Yet</h3>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Start with the Foundation Level to test your knowledge in <strong>{student.preferredDomain}</strong> and begin your assessment journey.
          </p>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#64748b',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '12px 16px',
  color: '#334155',
  whiteSpace: 'nowrap',
};
