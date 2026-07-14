'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function PlacementTracking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Unified application state
  const [applications, setApplications] = useState([]);
  const [allApplications, setAllApplications] = useState([]); // Used only for Card metrics
  const [jobs, setJobs] = useState([]);
  const [techTests, setTechTests] = useState([]);
  
  // State loaders
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  
  // Active UI views
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  // Filtering state
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('All Jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  // Interview Modal state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState({ date: '', link: '' });

  // Offer Modal state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerData, setOfferData] = useState({ salaryPackage: '', location: '', joiningDate: '', expiryDate: '', notes: '', offerLetter: null });

  const STAGES = [
    'Shortlisted for next round', 'Interview Scheduled', 
    'Interview Cleared', 'Offer Released', 'Joined', 'Rejected'
  ];

  // Initial mount load of Jobs, Tech Tests, and Applications (for metrics counting)
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // 1. Fetch jobs
        const jobsRes = await fetch('/api/company/jobs');
        const jobsJson = await jobsRes.json();
        let loadedJobs = [];
        if (jobsJson.success) {
          setJobs(jobsJson.jobs);
          loadedJobs = jobsJson.jobs;
          const uniqueRoles = [...new Set(jobsJson.jobs.map(j => j.title))].filter(Boolean);
          setJobRoles(uniqueRoles);
        }

        // 2. Fetch technical tests (assessment configuration checks)
        const testsRes = await fetch('/api/company/technical-tests');
        const testsJson = await testsRes.json();
        if (testsJson.success) {
          setTechTests(testsJson.data?.tests || testsJson.tests || []);
        }

        // 3. Fetch all applications (for dynamically calculating Job Card stats)
        const appsRes = await fetch('/api/company/applications');
        const appsJson = await appsRes.json();
        if (appsJson.success) {
          setAllApplications(appsJson.applications);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Synchronize URL search parameter changes
  useEffect(() => {
    const urlJobId = searchParams.get('jobId');
    if (urlJobId && jobs.length > 0) {
      const matchedJob = jobs.find(j => j._id === urlJobId);
      if (matchedJob) {
        setSelectedJob(matchedJob);
        fetchApplicationsForJob(urlJobId);
      } else {
        setSelectedJob(null);
        setApplications([]);
      }
    } else {
      setSelectedJob(null);
      setApplications([]);
    }
  }, [searchParams, jobs]);

  const fetchApplicationsForJob = async (jobId) => {
    try {
      setLoadingApplicants(true);
      const res = await fetch(`/api/company/applications?jobId=${jobId}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Re-fetch all applications for metrics refresh (e.g. after stage updates)
  const refreshAllApplications = async () => {
    try {
      const appsRes = await fetch('/api/company/applications');
      const appsJson = await appsRes.json();
      if (appsJson.success) {
        setAllApplications(appsJson.applications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStage = async (id, stage, additionalData = {}) => {
    try {
      const res = await fetch(`/api/company/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, ...additionalData })
      });
      const data = await res.json();
      if (data.success) {
        if (selectedJob) {
          fetchApplicationsForJob(selectedJob._id);
        }
        refreshAllApplications();
        if (showInterviewModal) setShowInterviewModal(false);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Update failed');
    }
  };
  const [sendingEmailId, setSendingEmailId] = useState(null);

  const handleSendEmail = async (id) => {
    setSendingEmailId(id);
    try {
      const res = await fetch(`/api/company/applications/${id}/send-email`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert('Email sent successfully.');
        if (selectedJob) {
          fetchApplicationsForJob(selectedJob._id);
        }
        refreshAllApplications();
      } else {
        alert(data.message || 'Unable to send email. Please try again.');
      }
    } catch (error) {
      alert('Unable to send email. Please try again.');
    } finally {
      setSendingEmailId(null);
    }
  };
  const handleScheduleInterview = (e) => {
    e.preventDefault();
    updateStage(selectedApp._id, 'Interview Scheduled', {
      interviewDate: interviewData.date,
      meetingLink: interviewData.link
    });
  };

  const handleGenerateOffer = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('applicationId', selectedApp._id);
      formData.append('jobRole', selectedApp.jobId?.title || 'Unknown Role');
      formData.append('salaryPackage', offerData.salaryPackage);
      formData.append('location', offerData.location);
      formData.append('joiningDate', offerData.joiningDate);
      formData.append('expiryDate', offerData.expiryDate);
      formData.append('notes', offerData.notes);
      
      if (offerData.offerLetter) {
        formData.append('offerLetter', offerData.offerLetter);
      }

      const res = await fetch('/api/company/offers', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Offer Generated Successfully!');
        setShowOfferModal(false);
        if (selectedJob) {
          fetchApplicationsForJob(selectedJob._id);
        }
        refreshAllApplications();
      } else {
        alert(data.message || 'Failed to generate offer');
      }
    } catch (error) {
      alert('Error generating offer');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
        <div className="text-slate-500 font-medium text-sm">Loading Candidate Tracker...</div>
      </div>
    );
  }

  // Apply frontend filters for search and status
  const filteredApps = applications.filter(app => {
    const matchesSearch = app.studentId?.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.jobId?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || app.stage === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleBack = () => {
    setSelectedJob(null);
    setApplications([]);
    router.push(pathname);
  };

  if (!selectedJob) {
    return (
      <div className="w-full min-w-0">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Candidate Tracker</h1>
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium shadow-sm">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            No Job Posts Found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {jobs.map(job => {
              const jobApps = allApplications.filter(app => app.jobId?._id === job._id || app.jobId === job._id);
              const test = techTests.find(t => t.jobId?._id === job._id || t.jobId === job._id);
              const hasAssessment = test ? 'Yes' : 'No';

              // Specific stages counting
              const totalCount = jobApps.length;
              const appliedCount = jobApps.filter(a => a.stage === 'Applied').length;
              const assessmentCompletedCount = jobApps.filter(a => a.stage === 'Assessment Completed').length;
              const shortlistedCount = jobApps.filter(a => a.stage === 'Shortlisted for next round').length;
              const interviewScheduledCount = jobApps.filter(a => a.stage === 'Interview Scheduled').length;
              const selectedCount = jobApps.filter(a => a.stage === 'Joined' || a.stage === 'Offer Released' || a.stage === 'Interview Cleared').length;
              const rejectedCount = jobApps.filter(a => a.stage === 'Rejected').length;

              return (
                <div key={job._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${job.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {job.isActive ? 'Published' : 'Closed'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-800 line-clamp-2 leading-tight" title={job.title}>
                      {job.title}
                    </h3>

                    {/* Metadata fields */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 my-3 text-[11px] text-slate-500 font-medium">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.experience && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                          <span>{job.experience}</span>
                        </div>
                      )}
                      {job.role && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                          <span>{job.role}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 my-4 pt-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Assessment Required:</span>
                        <span className={`font-bold ${hasAssessment === 'Yes' ? 'text-indigo-600' : 'text-slate-400'}`}>{hasAssessment}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Applied:</span>
                        <span className="font-bold text-slate-700">{appliedCount}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Assessment Completed:</span>
                        <span className="font-bold text-slate-700">{assessmentCompletedCount}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Shortlisted for next round:</span>
                        <span className="font-bold text-slate-700">{shortlistedCount}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Interview Scheduled:</span>
                        <span className="font-bold text-slate-700">{interviewScheduledCount}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Selected:</span>
                        <span className="font-bold text-emerald-600">{selectedCount}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Rejected:</span>
                        <span className="font-bold text-red-500">{rejectedCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5 mt-5 flex items-center justify-between gap-4">
                    <div className="flex flex-col items-start">
                      <span className="text-3xl font-black text-slate-800 leading-none">{totalCount}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">Applicants</span>
                    </div>

                    <button
                      onClick={() => {
                        router.push(`${pathname}?jobId=${job._id}`);
                      }}
                      className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      View Candidates
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <button 
        onClick={handleBack} 
        className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to Jobs
      </button>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Candidate Tracker</h1>
          <div className="text-sm text-slate-500 mt-1 font-medium">
            Selected Job: <strong className="text-slate-800">{selectedJob.title}</strong>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-1.5 text-right shrink-0">
          <span className="text-xl font-black text-indigo-700">{applications.length}</span>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Applicants</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Search Candidates</label>
          <input 
            type="text" 
            placeholder="Search by name or job..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm font-medium"
          />
        </div>
        
        <div className="w-full md:w-56">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Selected Job</label>
          <input 
            type="text" 
            readOnly 
            value={selectedJob.title}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 outline-none text-sm font-medium"
          />
        </div>

        <div className="w-full md:w-44">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm font-medium"
          >
            <option value="All Status">All Status</option>
            {STAGES.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>

        <div>
          <button 
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All Status');
            }}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {loadingApplicants ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-12 min-h-[300px] shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <div className="text-slate-500 font-medium text-sm">Fetching candidates...</div>
        </div>
      ) : (
        <>
          {/* Pipeline Statistics Cards */}
          {(() => {
            const stats = [
              { label: 'Total Applicants', count: applications.length, iconColor: 'text-slate-700', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> },
              { label: 'Applied', count: applications.filter(a => a.stage === 'Applied').length, iconColor: 'text-blue-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> },
              { label: 'Shortlisted for next round', count: applications.filter(a => a.stage === 'Shortlisted for next round').length, iconColor: 'text-amber-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg> },
              { label: 'Interview', count: applications.filter(a => a.stage === 'Interview Scheduled').length, iconColor: 'text-purple-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> },
              { label: 'Selected', count: applications.filter(a => a.stage === 'Joined' || a.stage === 'Offer Released').length, iconColor: 'text-emerald-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
              { label: 'Rejected', count: applications.filter(a => a.stage === 'Rejected').length, iconColor: 'text-red-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
            ];
            return (
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-xl p-2.5 border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className={`${stat.iconColor} mb-1`}>{stat.icon}</div>
                    <div className="text-lg font-bold text-slate-800">{stat.count}</div>
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 table-fixed">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-2 py-2.5 w-[5%]">Rank</th>
                    <th className="px-2 py-2.5 w-[18%]">Candidate</th>
                    <th className="px-2 py-2.5 w-[12%]">Applied Job</th>
                    <th className="px-2 py-2.5 w-[11%]">Applied Date</th>
                    <th className="px-2 py-2.5 w-[16%]">Skill Match</th>
                    <th className="px-2 py-2.5 w-[12%]">Assessment</th>
                    <th className="px-2 py-2.5 w-[15%]">Current Stage</th>
                    <th className="px-2 py-2.5 text-right w-[11%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
              {filteredApps.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-2.5">
                    <div className={`font-black text-sm ${app.rankValue <= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {app.rankString || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="font-bold text-slate-800 text-xs truncate">{app.studentId?.userId?.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{app.studentId?.userId?.email}</div>
                    <div className="text-[10px] text-indigo-600 hover:underline mt-0.5 font-medium">
                      <a href={app.studentId?.resumeUrl} target="_blank" rel="noreferrer">View Resume</a>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="font-semibold text-slate-700 text-xs truncate">{app.jobId?.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">{app.jobId?.department}</div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="text-slate-700 font-medium text-xs">
                      {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(app.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${app.aiResumeScore >= 70 ? 'bg-emerald-100 text-emerald-700' : app.aiResumeScore >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {app.aiResumeScore || 0}%
                      </div>
                      <div className="text-[10px] text-slate-500 min-w-0">
                        <div className="font-semibold text-slate-700 truncate">{app.assessmentResult?.domain || 'N/A'}</div>
                        <div>Exp: {app.aiExperienceMatch || 0}%</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    {app.assessmentResult ? (
                      <div>
                        <div className={`font-bold text-base ${app.assessmentResult.percentage >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {app.assessmentResult.percentage}%
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${app.assessmentResult.passFail === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {app.assessmentResult.passFail}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Test: {new Date(app.assessmentResult.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs">Not Taken</div>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <select 
                      value={app.stage}
                      onChange={(e) => {
                        const stage = e.target.value;
                        if (stage === 'Interview Scheduled') {
                          router.push('/company/interviews');
                        } else if (stage === 'Offer Released') {
                          setSelectedApp(app);
                          setOfferData({ salaryPackage: '', location: '', joiningDate: '', expiryDate: '', notes: '', offerLetter: null });
                          setShowOfferModal(true);
                        } else {
                          updateStage(app._id, stage);
                        }
                      }}
                      className={`text-[10px] font-bold rounded-lg px-2 py-1 border outline-none cursor-pointer w-full
                        ${app.stage === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        ${app.stage === 'Joined' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                        ${app.stage !== 'Rejected' && app.stage !== 'Joined' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''}
                      `}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button 
                      onClick={() => handleSendEmail(app._id)}
                      disabled={sendingEmailId === app._id}
                      className="text-[10px] font-bold text-white bg-[#0B1E40] hover:bg-[#152d54] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {sendingEmailId === app._id ? 'Sending...' : 'Send Email'}
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-2 py-12 text-center text-slate-500">
                    No applications match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Interview Scheduling Modal */}
      {showInterviewModal && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Schedule Interview</h2>
              <button onClick={() => setShowInterviewModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleScheduleInterview} className="p-6 space-y-4">
              <div className="mb-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900 text-sm">
                Scheduling interview for <strong>{selectedApp.studentId?.userId?.name}</strong> for the position of <strong>{selectedApp.jobId?.title}</strong>.
                <br/>
                <span className="text-xs opacity-75 mt-1 block">An automated Email and SMS will be sent to the candidate upon confirming.</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date & Time</label>
                <input required type="datetime-local" value={interviewData.date} onChange={e => setInterviewData({...interviewData, date: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Link</label>
                <input required type="url" value={interviewData.link} onChange={e => setInterviewData({...interviewData, link: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
              </div>

              <div className="pt-4 mt-2 flex gap-3">
                <button type="button" onClick={() => setShowInterviewModal(false)} className="flex-1 px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Generation Modal */}
      {showOfferModal && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Generate Job Offer</h2>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleGenerateOffer} className="space-y-4">
                <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 text-sm">
                  Generating offer for <strong>{selectedApp.studentId?.userId?.name}</strong> for the role of <strong>{selectedApp.jobId?.title}</strong>.
                  <br/>
                  <span className="text-xs opacity-75 mt-1 block">Once generated, the offer will be available in the student dashboard and matched college portal.</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Salary Package</label>
                    <input required placeholder="e.g., 5 LPA" type="text" value={offerData.salaryPackage} onChange={e => setOfferData({...offerData, salaryPackage: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                    <input required placeholder="e.g., Chennai" type="text" value={offerData.location} onChange={e => setOfferData({...offerData, location: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Joining Date</label>
                    <input required type="date" value={offerData.joiningDate} onChange={e => setOfferData({...offerData, joiningDate: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Offer Expiry Date</label>
                    <input required type="date" value={offerData.expiryDate} onChange={e => setOfferData({...offerData, expiryDate: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Upload Offer Letter (PDF)</label>
                  <input type="file" accept=".pdf" onChange={e => setOfferData({...offerData, offerLetter: e.target.files[0]})} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional Notes</label>
                  <textarea rows="2" placeholder="Any terms, conditions, or instructions..." value={offerData.notes} onChange={e => setOfferData({...offerData, notes: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500"></textarea>
                </div>

                <div className="pt-4 mt-2 flex gap-3">
                  <button type="button" onClick={() => setShowOfferModal(false)} className="flex-1 px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors">
                    Generate Offer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
