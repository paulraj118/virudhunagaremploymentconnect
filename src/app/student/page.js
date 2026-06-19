'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null); // null means not enrolled, else object
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    collegeName: '', degree: '', department: '', yearOfPassedOut: '',
    yearsOfExperience: '0', industryTrack: '',
    skills: '', preferredDomain: '', resumeUrl: 'https://example.com/resume.pdf'
  });

  const IT_DOMAINS = [
    'Software Development', 'Web Development', 'Frontend', 'Backend', 'Full Stack',
    'Android', 'iOS', 'Data Science', 'Data Analytics', 'AI & ML', 'Cyber Security',
    'Cloud', 'DevOps', 'UI/UX', 'QA Testing'
  ];

  const NON_IT_DOMAINS = [
    'Sales & Marketing', 'Human Resources (HR)', 'Finance & Accounting', 'Business Development',
    'Customer Support', 'Operations Management', 'Mechanical Engineering', 'Electrical Engineering',
    'Civil Engineering', 'Administration', 'Healthcare & Medical', 'Content Writing'
  ];

  const handleTrackChange = (track) => {
    setFormData(prev => ({
      ...prev,
      industryTrack: track,
      preferredDomain: ''
    }));
  };

  useEffect(() => {
    fetchEnrollmentStatus();
  }, []);

  const fetchEnrollmentStatus = async () => {
    try {
      const res = await fetch('/api/student/enrollment');
      const data = await res.json();
      if (data.enrolled) {
        setEnrollmentStatus(data.student);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert comma separated skills to array
      const payload = {
        ...formData,
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
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your profile...</div>;

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
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Welcome back, Future Expert!</h2>
                <p className="text-indigo-100 font-medium text-lg max-w-xl">
                  Your profile is approved and active. Keep upgrading your skills and applying to top jobs.
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Assessment Card with Chart */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                <div className="relative z-10 flex items-center gap-6">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90 drop-shadow-sm">
                      <circle cx="48" cy="48" r="38" className="text-slate-100" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="38" 
                        className="text-indigo-500 transition-all duration-1500 ease-out" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 38} 
                        strokeDashoffset={2 * Math.PI * 38 * (1 - (enrollmentStatus.assessmentScore || 0) / 100)} 
                        strokeLinecap="round" 
                        stroke="currentColor"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-800">{enrollmentStatus.assessmentScore || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assessment</h3>
                    <p className="text-slate-600 text-sm font-semibold leading-snug">Your current competency score.</p>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
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
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                <div className="relative z-10 h-full flex flex-col justify-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Career Track</h3>
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <span className="text-xl font-black text-slate-800 leading-tight block">{enrollmentStatus.preferredDomain}</span>
                      <p className="text-purple-600 text-sm font-bold mt-1">{enrollmentStatus.industryTrack || 'IT'} Track</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skills Radar / Bar Chart Mockup */}
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
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
              <div className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-800 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
                
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 backdrop-blur-sm border border-white/5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  </div>
                  Your Top Skills
                </h3>
                
                <div className="flex flex-wrap gap-3.5 relative z-10">
                  {enrollmentStatus.skills && enrollmentStatus.skills.length > 0 ? (
                    enrollmentStatus.skills.map((skill, i) => (
                      <span key={i} className="bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-default backdrop-blur-sm drop-shadow-md">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 font-medium">No skills listed. Update your profile.</span>
                  )}
                </div>
              </div>
            </div>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Industry Track (IT / NON-IT)</label>
                <div className="flex gap-4">
                  <label className={`flex-1 cursor-pointer border rounded-lg px-4 py-3 text-sm text-center transition-colors ${formData.industryTrack === 'IT' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                    <input type="radio" name="industryTrack" className="hidden" checked={formData.industryTrack === 'IT'} onChange={() => handleTrackChange('IT')} required />
                    IT
                  </label>
                  <label className={`flex-1 cursor-pointer border rounded-lg px-4 py-3 text-sm text-center transition-colors ${formData.industryTrack === 'NON-IT' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                    <input type="radio" name="industryTrack" className="hidden" checked={formData.industryTrack === 'NON-IT'} onChange={() => handleTrackChange('NON-IT')} required />
                    NON-IT
                  </label>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(formData.industryTrack === 'IT' ? IT_DOMAINS : NON_IT_DOMAINS).map(domain => (
                      <label key={domain} className={`cursor-pointer border rounded-lg px-3 py-2 text-sm text-center transition-colors ${formData.preferredDomain === domain ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                        <input type="radio" name="domain" className="hidden" checked={formData.preferredDomain === domain} onChange={() => setFormData({...formData, preferredDomain: domain})} />
                        {domain}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors">Back</button>
                <button type="submit" disabled={!formData.preferredDomain || loading} className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Submit Enrollment'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
