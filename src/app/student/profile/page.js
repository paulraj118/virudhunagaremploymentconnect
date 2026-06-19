'use client';

import { useState, useEffect } from 'react';

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [skills, setSkills] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [atsScore, setAtsScore] = useState(0);

  // Resume Upload State
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/student/enrollment');
      const data = await res.json();
      if (data.enrolled) {
        setStudent(data.student);
        setSkills(data.student.skills.join(', '));
        setResumeUrl(data.student.resumeUrl || '');
        setAtsScore(data.student.atsScore || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, resumeUrl })
      });
      const data = await res.json();
      if (data.success) {
        alert('Profile updated successfully!');
        fetchProfile();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
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
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await fetch('/api/student/resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      clearInterval(progressInterval);
      setScanProgress(100);

      if (data.success) {
        setTimeout(() => {
          setResumeUrl(data.resumeUrl);
          setAtsScore(data.atsScore);
          setUploading(false);
          setFile(null);
        }, 800); // give time for 100% animation to show
      } else {
        alert(data.message);
        setUploading(false);
      }

    } catch (error) {
      clearInterval(progressInterval);
      setUploading(false);
      alert('Upload failed');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium animate-pulse">Loading profile...</p>
    </div>
  );

  if (!student) return <div>Please complete enrollment first.</div>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-7xl mx-auto pb-10">
      
      {/* Left Column: Details & Skills */}
      <div className="xl:col-span-7 space-y-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h2 className="text-2xl font-black relative z-10">Profile Management</h2>
            <p className="text-slate-300 text-sm mt-2 relative z-10">Update your core competencies and details.</p>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Academic Info</div>
                <div className="font-bold text-slate-800 text-lg">{student.degree} in {student.department}</div>
                <div className="text-sm text-slate-500 mt-1">{student.collegeName} (Passed: {student.yearOfPassedOut})</div>
                <div className="text-xs font-semibold text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block mt-3">Exp: {student.yearsOfExperience || 0} Yrs</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Domain Focus</div>
                <div className="font-black text-indigo-600 text-xl">{student.preferredDomain}</div>
                <div className="text-xs font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg inline-block mt-3 uppercase">{student.industryTrack || 'IT'} Track</div>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6 border-t border-slate-100 pt-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Technical Skills (comma separated)</label>
                <textarea 
                  rows="4"
                  value={skills} 
                  onChange={(e) => setSkills(e.target.value)} 
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all outline-none resize-none font-medium text-slate-700" 
                  placeholder="React, Node.js, Python, AWS..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={updating}
                  className="bg-slate-900 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-slate-800 transition-all shadow-md active:translate-y-px disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column: ATS Resume Scanner */}
      <div className="xl:col-span-5 space-y-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative">
          <div className="p-8">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              AI ATS Scanner
            </h3>

            {/* Upload Area */}
            {!uploading ? (
              <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-slate-200 border-dashed rounded-3xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group overflow-hidden">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  </div>
                  <p className="mb-1 text-sm font-bold text-slate-700">Click to upload or drag PDF</p>
                  <p className="text-xs text-slate-400 font-medium">Update your resume to check ATS Score</p>
                </div>
                <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
              </label>
            ) : (
              /* Scanning Animation UI */
              <div className="w-full h-48 border-2 border-indigo-200 bg-indigo-50/50 rounded-3xl flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Scanning line animation */}
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                
                <svg className="w-10 h-10 text-indigo-500 mb-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                <div className="font-bold text-indigo-900 mb-2">Analyzing Resume...</div>
                
                <div className="w-full max-w-xs bg-indigo-200/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${scanProgress}%` }}></div>
                </div>
                <div className="text-xs font-bold text-indigo-500 mt-2">{scanProgress}% completed</div>
              </div>
            )}

            {/* ATS Score Result Display */}
            {atsScore > 0 && !uploading && (
              <div className="mt-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Latest Scan Results</h4>
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl text-white relative overflow-hidden shadow-lg shadow-indigo-900/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  
                  <div className="flex items-center gap-6">
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="38" className="text-white/10" strokeWidth="8" fill="transparent" />
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="38" 
                          className={`${atsScore >= 80 ? 'text-emerald-400' : atsScore >= 60 ? 'text-amber-400' : 'text-rose-400'} transition-all duration-1500 ease-out`} 
                          strokeWidth="8" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 38} 
                          strokeDashoffset={2 * Math.PI * 38 * (1 - atsScore / 100)} 
                          strokeLinecap="round" 
                          stroke="currentColor"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-white">{atsScore}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-black text-lg mb-1">
                        {atsScore >= 80 ? 'Excellent Match!' : atsScore >= 60 ? 'Good Potential' : 'Needs Improvement'}
                      </h4>
                      <p className="text-indigo-200 text-sm font-medium leading-snug">
                        Your resume matches our internal ATS criteria based on your domain.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {resumeUrl && !uploading && (
              <div className="mt-6 flex justify-center">
                <a 
                  href={resumeUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-xl"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  View Current Resume
                </a>
              </div>
            )}
          </div>
        </div>
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
