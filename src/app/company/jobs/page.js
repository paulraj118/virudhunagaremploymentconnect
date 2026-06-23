'use client';

import { useState, useEffect } from 'react';

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', department: '', role: '', experience: '', salary: '', 
    skills: '', vacancyCount: '', deadline: '', location: '', description: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/company/jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/company/jobs/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          fetchJobs();
        } else {
          alert(data.message || 'Failed to delete job');
        }
      } catch (error) {
        alert('Failed to delete job due to a network error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/company/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchJobs(); // Refresh jobs
        setFormData({ title: '', department: '', role: '', experience: '', salary: '', skills: '', vacancyCount: '', deadline: '', location: '', description: '' });
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Job creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Job Postings</h1>
        <button onClick={() => setShowModal(true)} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-md hover:shadow-lg text-sm">
          + Create New Job
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <div key={job._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
            {!job.isActive && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
            {job.isActive && <div className="absolute top-0 left-0 w-full h-1 bg-[#2563EB]"></div>}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{job.title}</h3>
                <p className="text-slate-500 text-sm">{job.department} • {job.location}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${job.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {job.isActive ? 'Active' : 'Closed'}
              </span>
            </div>
            
            <div className="space-y-2 mb-6 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Experience</span>
                <span className="font-medium text-slate-700">{job.experience}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Salary</span>
                <span className="font-medium text-slate-700">{job.salary}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Vacancies</span>
                <span className="font-medium text-slate-700">{job.vacancyCount} Openings</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Deadline</span>
                <span className="font-medium text-red-600">{new Date(job.deadline).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-2 rounded-lg transition-colors text-sm">
                Edit
              </button>
              <button onClick={() => handleDeleteJob(job._id)} className="w-10 flex flex-shrink-0 items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 transition-colors" title="Delete Job">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
            <p className="text-slate-500 text-lg">No jobs posted yet.</p>
            <button onClick={() => setShowModal(true)} className="text-indigo-600 font-bold mt-2 hover:underline">Create your first job posting</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Create New Job Posting</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Role</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Experience Required</label>
                  <input required type="text" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="e.g. 0-2 Years" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Salary Offer</label>
                  <input required type="text" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="e.g. 8 LPA" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vacancy Count</label>
                  <input required type="number" min="1" value={formData.vacancyCount} onChange={e => setFormData({...formData, vacancyCount: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Application Deadline</label>
                  <input required type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Required Skills (comma separated)</label>
                <input required type="text" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, Node.js, Python" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Description</label>
                <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500"></textarea>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                  {submitting ? 'Posting...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
