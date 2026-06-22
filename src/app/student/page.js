'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null); // null means not enrolled, else object
  const [showAssessmentsModal, setShowAssessmentsModal] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    collegeName: '', degree: '', department: '', yearOfPassedOut: '',
    yearsOfExperience: '0', industryTrack: '',
    skills: '', preferredDomain: '', resumeUrl: ''
  });

  // Resume Upload State
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [atsScore, setAtsScore] = useState(0);

  const TRACK_DOMAINS = {
    'Arts / Engineering': [
      'English Literature', 'Tamil Literature', 'History', 'Economics', 'Psychology',
      'Sociology', 'Journalism & Mass Communication', 'Visual Communication', 'Fine Arts',
      'Data Science', 'Artificial Intelligence & Machine Learning', 'Cyber Security',
      'Cloud Computing', 'Full Stack Development', 'Mechanical Engineering',
      'Civil Engineering', 'Electrical Engineering',
      'Electronics & Communication Engineering (ECE)', 'Automobile Engineering', 'Others'
    ],
    'Admin / Management': [
      'Human Resources (HR)', 'Marketing', 'Finance', 'Operations Management',
      'Business Analytics', 'Supply Chain Management', 'Banking', 'Accounting',
      'Entrepreneurship', 'Others'
    ],
    'Pharma / Medical': [
      'Pharmacy', 'Clinical Research', 'Nursing', 'Physiotherapy',
      'Medical Laboratory Technology', 'Healthcare Management', 'Biotechnology',
      'Pharmacovigilance', 'Public Health', 'Others'
    ],
  };

  const TRACKS = Object.keys(TRACK_DOMAINS);

  const [customDomain, setCustomDomain] = useState('');

  const handleTrackChange = (track) => {
    setFormData(prev => ({
      ...prev,
      industryTrack: track,
      preferredDomain: ''
    }));
    setCustomDomain('');
  };

  const handleDomainSelect = (domain) => {
    if (domain === 'Others') {
      setFormData(prev => ({ ...prev, preferredDomain: 'Others' }));
      setCustomDomain('');
    } else {
      setFormData(prev => ({ ...prev, preferredDomain: domain }));
      setCustomDomain('');
    }
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      if (selected.size > 4 * 1024 * 1024) {
        alert("File size must be less than 4MB. Vercel limits uploads to 4MB.");
        return;
      }
      setFile(selected);
      await handleUploadAndScan(selected);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  const handleUploadAndScan = async (selectedFile) => {
    setUploading(true);
    setScanProgress(0);
    
    // Simulate scan progress animation
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) return prev; // Hold at 90% until backend responds
        return prev + 10;
      });
    }, 300);

    try {
      const formDataObj = new FormData();
      formDataObj.append('resume', selectedFile);

      const res = await fetch('/api/student/resume', {
        method: 'POST',
        body: formDataObj,
      });

      const data = await res.json();
      
      clearInterval(progressInterval);
      setScanProgress(100);

      if (data.success) {
        setTimeout(() => {
          setFormData(prev => ({ ...prev, resumeUrl: data.resumeUrl }));
          setAtsScore(data.atsScore);
          setUploading(false);
        }, 800); // give time for 100% animation to show
      } else {
        alert(data.message);
        setUploading(false);
        setFile(null);
      }

    } catch (error) {
      clearInterval(progressInterval);
      setUploading(false);
      setFile(null);
      alert('Upload failed');
    }
  };

  // Compute the final domain value for submission
  const getFinalDomain = () => {
    if (formData.preferredDomain === 'Others') {
      return customDomain.trim();
    }
    return formData.preferredDomain;
  };

  const isDomainValid = formData.preferredDomain && (formData.preferredDomain !== 'Others' || customDomain.trim().length > 0);

  useEffect(() => {
    if (!authLoading && user && user.role === 'student') {
      fetchEnrollmentStatus();
    } else if (!authLoading && !user) {
      setProfileLoading(false);
    }
  }, [user, authLoading]);

  const fetchEnrollmentStatus = async () => {
    try {
      const res = await fetch('/api/student/enrollment');
      const data = await res.json();
      if (data.enrolled) {
        setEnrollmentStatus({ ...data.student, assessments: data.assessments || [] });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEnrollmentSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      // Convert comma separated skills to array
      const payload = {
        ...formData,
        preferredDomain: getFinalDomain(),
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      };

      const res = await fetch('/api/student/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setEnrollmentStatus(data.student);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Submission failed');
    } finally {
      setProfileLoading(false);
    }
  };

  if (authLoading || profileLoading) return <div className="p-8 text-center text-slate-500">Loading your profile...</div>;

  if (enrollmentStatus) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Student Dashboard</h1>
        
        {enrollmentStatus.enrollmentStatus === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl shadow-sm mb-6">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Enrollment Pending Approval
            </h3>
            <p className="text-sm">Your profile has been submitted and is currently under review by the Administrator. You will be able to access assessments and job applications once approved.</p>
          </div>
        )}

        {enrollmentStatus.enrollmentStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl shadow-sm mb-6">
            <h3 className="font-bold text-lg mb-2">Enrollment Rejected</h3>
            <p className="text-sm">Unfortunately, your enrollment application was not approved. Please contact support for more details.</p>
          </div>
        )}

        {enrollmentStatus.enrollmentStatus === 'approved' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Assessment Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 border-t-4 border-t-indigo-500 flex flex-col justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assessment</h3>
                    <div className="text-xl font-black text-slate-800 mt-0.5">{enrollmentStatus.assessmentScore || 0}% Score</div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAssessmentsModal(true)}
                  className="mt-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  View All Attempts
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              </div>

              {/* Status Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 border-t-4 border-t-emerald-500 flex flex-col justify-center">
                <div className="relative z-10 h-full flex flex-col justify-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Placement Status</h3>
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-slate-800 capitalize tracking-tight">{enrollmentStatus.placementStatus}</span>
                      <p className="text-emerald-600 text-sm font-bold mt-0.5">Active & Ready</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Domain Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 border-t-4 border-t-purple-500 flex flex-col justify-center">
                <div className="relative z-10 h-full flex flex-col justify-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Career Track</h3>
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <span className="text-xl font-black text-slate-800 leading-tight block">{enrollmentStatus.preferredDomain}</span>
                      <p className="text-purple-600 text-sm font-bold mt-1">{enrollmentStatus.industryTrack} Track</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Analytics Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 border-t-4 border-t-indigo-500">
                <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  Profile Strength Analytics
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2.5">
                      <span className="text-slate-700">Technical Skills Match</span>
                      <span className="text-indigo-600">70%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000 delay-100" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2.5">
                      <span className="text-slate-700">Domain Readiness</span>
                      <span className="text-emerald-600">70%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 delay-300" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2.5">
                      <span className="text-slate-700">Profile Completeness</span>
                      <span className="text-purple-600">100%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full transition-all duration-1000 delay-500" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 border-t-4 border-t-indigo-500">
                <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  </div>
                  Your Top Skills
                </h3>
                
                <div className="flex flex-wrap gap-3.5 relative z-10">
                  {enrollmentStatus.skills && enrollmentStatus.skills.length > 0 ? (
                    enrollmentStatus.skills.map((skill, i) => (
                      <span key={i} className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-default">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 font-medium">No skills listed. Update your profile.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Assessments Modal */}
            {showAssessmentsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-350 border border-slate-100">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-2xl font-black text-slate-800">Assessment History</h3>
                    <button 
                      onClick={() => setShowAssessmentsModal(false)}
                      className="text-slate-400 hover:text-slate-650 transition-colors p-2 rounded-full hover:bg-slate-150"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                    {enrollmentStatus.assessments && enrollmentStatus.assessments.length > 0 ? (
                      enrollmentStatus.assessments.map((attempt, index) => (
                        <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{attempt.domain || 'General Assessment'}</div>
                            <div className="text-sm font-semibold text-slate-700">Attempted on {new Date(attempt.submissionTimestamp || attempt.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${attempt.passFail === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              {attempt.passFail}
                            </span>
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-slate-800 shadow-sm">
                              {attempt.percentage || attempt.score}%
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-500 font-medium">No assessment history available.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    );
  }

  // Enrollment Form
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete Your Profile</h2>
        <p className="text-slate-500 mb-8">You need to complete your enrollment to access the platform features.</p>
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
        </div>

        <form onSubmit={step === 2 ? handleEnrollmentSubmit : (e) => { e.preventDefault(); setStep(2); }}>
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="font-semibold text-lg text-slate-700 border-b pb-2">Academic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">College Name</label>
                  <input required type="text" value={formData.collegeName} onChange={e => setFormData({...formData, collegeName: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Degree (e.g. B.Tech)</label>
                  <input required type="text" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year of Passed Out</label>
                  <input required type="number" min="2000" max="2035" placeholder="e.g. 2026" value={formData.yearOfPassedOut} onChange={e => setFormData({...formData, yearOfPassedOut: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full mt-6 bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 transition-colors">Next Step: Skills & Domain</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="font-semibold text-lg text-slate-700 border-b pb-2">Professional Details</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Industry Track</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TRACKS.map(track => (
                    <label key={track} className={`cursor-pointer border rounded-lg px-4 py-3 text-sm text-center transition-colors ${formData.industryTrack === track ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                      <input type="radio" name="industryTrack" className="hidden" checked={formData.industryTrack === track} onChange={() => handleTrackChange(track)} required />
                      {track}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma separated)</label>
                <input required type="text" placeholder="React, Node.js, Python" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
                <input required type="number" min="0" max="45" placeholder="e.g. 2 (use 0 for fresher)" value={formData.yearsOfExperience} onChange={e => setFormData({...formData, yearsOfExperience: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Domain</label>
                {!formData.industryTrack ? (
                  <div className="text-sm text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center">
                    Please select an Industry Track first.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {TRACK_DOMAINS[formData.industryTrack].map(domain => (
                        <label key={domain} className={`cursor-pointer border rounded-lg px-3 py-2 text-sm text-center transition-colors ${formData.preferredDomain === domain ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                          <input type="radio" name="domain" className="hidden" checked={formData.preferredDomain === domain} onChange={() => handleDomainSelect(domain)} />
                          {domain}
                        </label>
                      ))}
                    </div>
                    {formData.preferredDomain === 'Others' && (
                      <input
                        type="text"
                        required
                        value={customDomain}
                        onChange={e => setCustomDomain(e.target.value)}
                        placeholder="Enter your preferred domain"
                        className="w-full mt-3 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Resume (PDF)</label>
                {!uploading ? (
                  <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group overflow-hidden">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      </div>
                      <p className="mb-1 text-sm font-bold text-slate-700">
                        {formData.resumeUrl ? 'Resume Uploaded! Click to replace' : 'Click to upload or drag PDF'}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="w-full h-32 border-2 border-indigo-200 bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                    <svg className="w-8 h-8 text-indigo-500 mb-2 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    <div className="w-full max-w-xs bg-indigo-200/50 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${scanProgress}%` }}></div>
                    </div>
                    <div className="text-xs font-bold text-indigo-500 mt-2">Uploading Resume... {scanProgress}%</div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors">Back</button>
                <button type="submit" disabled={!isDomainValid || !formData.resumeUrl || profileLoading || uploading} className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {profileLoading ? 'Submitting...' : 'Submit Enrollment'}
                </button>
              </div>
            </div>
          )}
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
