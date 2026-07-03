'use client';

import { useState, useEffect } from 'react';

export default function CollegeDrivesPage() {
  const [drives, setDrives] = useState([]);
  const [collegeName, setCollegeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  
  const [formData, setFormData] = useState({
    companyName: '',
    jobRole: '',
    jobDescription: '',
    industry: '',
    minAssessmentScore: 0,
    minEmployabilityScore: 0,
    minCgpa: '',
    maxActiveArrears: '',
    location: '',
    salaryPackage: '',
    vacancies: '',
    companyId: ''
  });

  useEffect(() => {
    fetchDrives();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/college/companies');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchDrives = async () => {
    try {
      const res = await fetch('/api/college/drives');
      const data = await res.json();
      if (data.success) {
        setDrives(data.drives);
        setCollegeName(data.collegeName || '');
      }
    } catch (err) {
      console.error('Error fetching drives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        minCgpa: formData.minCgpa ? parseFloat(formData.minCgpa) : undefined,
        maxActiveArrears: formData.maxActiveArrears ? parseInt(formData.maxActiveArrears) : undefined,
        vacancies: formData.vacancies ? parseInt(formData.vacancies) : undefined,
        companyId: formData.companyId || undefined,
        status: 'Draft' // Always created as Draft initially
      };
      
      // If companyId is selected, populate companyName automatically
      if (payload.companyId) {
        const selectedCompany = companies.find(c => c._id === payload.companyId);
        if (selectedCompany) {
          payload.companyName = selectedCompany.companyName;
        }
      }
      
      const res = await fetch('/api/college/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData({
          companyName: '',
          jobRole: '',
          jobDescription: '',
          industry: '',
          minAssessmentScore: 0,
          minEmployabilityScore: 0,
          minCgpa: '',
          maxActiveArrears: '',
          location: '',
          salaryPackage: '',
          vacancies: '',
          companyId: ''
        });
        fetchDrives();
      } else {
        alert(data.message || 'Failed to create drive');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to create drive');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Published' ? 'Closed' : 'Published';
    try {
      const res = await fetch(`/api/college/drives/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchDrives();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this placement drive?')) return;
    try {
      const res = await fetch(`/api/college/drives/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDrives();
      } else {
        alert(data.message || 'Failed to delete drive');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Placement Drives</h1>
          <p className="text-slate-500 text-sm">Create and manage job opportunities for your students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-900/10"
        >
          + Create Drive
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-bold">Company & Role</th>
                <th className="p-4 font-bold">Eligibility Criteria</th>
                <th className="p-4 font-bold">Details</th>
                <th className="p-4 font-bold">Created By</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {drives.map(drive => {
                const isOwned = drive.createdBy === collegeName;
                return (
                  <tr key={drive._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{drive.companyName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{drive.jobRole}</div>
                      <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md mt-1.5 inline-block font-medium">{drive.industry}</div>
                    </td>
                    <td className="p-4 text-xs text-slate-600 space-y-1">
                      <div>Min Assess: <span className="font-semibold text-slate-800">{drive.minAssessmentScore}%</span></div>
                      <div>Min Employability: <span className="font-semibold text-slate-800">{drive.minEmployabilityScore}/100</span></div>
                      {drive.minCgpa != null && <div>Min CGPA: <span className="font-semibold text-slate-800">{drive.minCgpa}</span></div>}
                      {drive.maxActiveArrears != null && <div>Max Arrears: <span className="font-semibold text-slate-800">{drive.maxActiveArrears}</span></div>}
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      <div>{drive.location || 'N/A'}</div>
                      <div className="font-semibold text-emerald-600 mt-0.5">{drive.salaryPackage || 'Not disclosed'}</div>
                      <div className="text-slate-400 mt-0.5">{drive.vacancies ? `${drive.vacancies} Vacancies` : 'Open'}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{isOwned ? 'Your College' : drive.createdBy}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${
                        drive.status === 'Published' ? 'bg-emerald-50 text-emerald-700' :
                        drive.status === 'Closed' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {drive.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {isOwned ? (
                        <div className="flex justify-end items-center gap-3">
                          <button 
                            onClick={() => handleToggleStatus(drive._id, drive.status)}
                            className={`text-xs font-bold transition-colors ${
                              drive.status === 'Published' ? 'text-rose-600 hover:text-rose-800' : 'text-indigo-600 hover:text-indigo-800'
                            }`}
                          >
                            {drive.status === 'Published' ? 'Close' : 'Publish'}
                          </button>
                          <button 
                            onClick={() => handleDelete(drive._id)}
                            className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">View Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {drives.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">No recruitment drives found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-slate-800">Create Placement Drive</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors text-2xl font-light"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4 text-sm text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Link Registered Company</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Company (Or Manual Override Below) --</option>
                  {companies.map(c => (
                    <option key={c._id} value={c._id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              {!formData.companyId && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Company Name (Override)</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Enter company name manually"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Job Role</label>
                  <input
                    type="text"
                    required
                    value={formData.jobRole}
                    onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                    placeholder="e.g. Frontend Engineer"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Industry</label>
                  <input
                    type="text"
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g. IT / Software"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Job Description</label>
                <textarea
                  required
                  rows="3"
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  placeholder="Describe the job duties, requirements..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="col-span-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">Eligibility Criteria</div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Min Assess Score (%)</label>
                  <input
                    type="number"
                    value={formData.minAssessmentScore}
                    onChange={(e) => setFormData({ ...formData, minAssessmentScore: parseInt(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Min Employability Score</label>
                  <input
                    type="number"
                    value={formData.minEmployabilityScore}
                    onChange={(e) => setFormData({ ...formData, minEmployabilityScore: parseInt(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Min CGPA (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minCgpa}
                    onChange={(e) => setFormData({ ...formData, minCgpa: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Active Arrears (Optional)</label>
                  <input
                    type="number"
                    value={formData.maxActiveArrears}
                    onChange={(e) => setFormData({ ...formData, maxActiveArrears: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Chennai"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Salary Package</label>
                  <input
                    type="text"
                    value={formData.salaryPackage}
                    onChange={(e) => setFormData({ ...formData, salaryPackage: e.target.value })}
                    placeholder="e.g. 4.5 LPA"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vacancies</label>
                  <input
                    type="number"
                    value={formData.vacancies}
                    onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-end gap-3 sticky bottom-0 mt-6">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-900/10"
                >
                  Create Drive
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
