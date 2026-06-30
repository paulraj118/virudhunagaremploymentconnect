'use client';

import { useState, useEffect } from 'react';

export default function AdminDrivesPage() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    jobRole: '',
    jobDescription: '',
    industry: '',
    minAssessmentScore: 0,
    minEmployabilityScore: 0,
    minCgpa: '',
    maxActiveArrears: '',
    maxActiveArrears: '',
    location: '',
    salaryPackage: '',
    vacancies: '',
    companyId: ''
  });
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchDrives();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies.filter(c => c.status === 'Approved'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDrives = async () => {
    try {
      const res = await fetch('/api/admin/drives');
      const data = await res.json();
      if (data.success) {
        setDrives(data.drives);
      }
    } catch (err) {
      console.error(err);
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
        createdBy: 'Admin'
      };
      
      // If companyId is selected, populate companyName automatically
      if (payload.companyId) {
        const selectedCompany = companies.find(c => c._id === payload.companyId);
        if (selectedCompany) {
          payload.companyName = selectedCompany.companyName;
        }
      }
      
      const res = await fetch('/api/admin/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchDrives();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Failed to create drive');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Published' ? 'Closed' : 'Published';
    try {
      await fetch(`/api/admin/drives/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchDrives();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this drive?')) return;
    try {
      await fetch(`/api/admin/drives/${id}`, { method: 'DELETE' });
      fetchDrives();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Campus Recruitment Drives</h1>
          <p className="text-slate-500 text-sm">Manage placements and job opportunities for candidates.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
        >
          + Create Drive
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-bold">Company & Role</th>
              <th className="p-4 font-bold">Eligibility Criteria</th>
              <th className="p-4 font-bold">Details</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drives.map(drive => (
              <tr key={drive._id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-bold text-slate-800">{drive.companyName}</div>
                  <div className="text-xs text-slate-500">{drive.jobRole}</div>
                  <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">{drive.industry}</div>
                </td>
                <td className="p-4 text-xs text-slate-600 space-y-1">
                  <div>Min Assess: <span className="font-semibold text-slate-800">{drive.minAssessmentScore}%</span></div>
                  <div>Min Employability: <span className="font-semibold text-slate-800">{drive.minEmployabilityScore}/100</span></div>
                  {drive.minCgpa && <div>Min CGPA: <span className="font-semibold text-slate-800">{drive.minCgpa}</span></div>}
                  {drive.maxActiveArrears != null && <div>Max Arrears: <span className="font-semibold text-slate-800">{drive.maxActiveArrears}</span></div>}
                </td>
                <td className="p-4 text-xs text-slate-600">
                  <div>{drive.location}</div>
                  <div className="font-semibold text-emerald-600">{drive.salaryPackage}</div>
                  <div>{drive.vacancies ? `${drive.vacancies} Vacancies` : 'Open'}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    drive.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                    drive.status === 'Closed' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {drive.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => handleToggleStatus(drive._id, drive.status)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {drive.status === 'Published' ? 'Close' : 'Publish'}
                  </button>
                  <button 
                    onClick={() => handleDelete(drive._id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {drives.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No recruitment drives found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Create Recruitment Drive</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link to Registered Company (Optional)</label>
                  <select value={formData.companyId} onChange={e => setFormData({...formData, companyId: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                    <option value="">-- No Linked Company (Manual Entry) --</option>
                    {companies.map(c => (
                      <option key={c._id} value={c._id}>{c.companyName} ({c.companyCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name * (Override)</label>
                  <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Role *</label>
                  <input required type="text" value={formData.jobRole} onChange={e => setFormData({...formData, jobRole: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Description *</label>
                  <textarea required value={formData.jobDescription} onChange={e => setFormData({...formData, jobDescription: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" rows="3"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Industry *</label>
                  <input required type="text" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Salary Package</label>
                  <input type="text" value={formData.salaryPackage} onChange={e => setFormData({...formData, salaryPackage: e.target.value})} placeholder="e.g. 4-6 LPA" className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vacancies</label>
                  <input type="number" value={formData.vacancies} onChange={e => setFormData({...formData, vacancies: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                
                <div className="col-span-2 mt-4 border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-700 text-sm">Eligibility Criteria</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min Assessment Score (%)</label>
                  <input type="number" value={formData.minAssessmentScore} onChange={e => setFormData({...formData, minAssessmentScore: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min Employability Score (0-100)</label>
                  <input type="number" value={formData.minEmployabilityScore} onChange={e => setFormData({...formData, minEmployabilityScore: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min CGPA (Optional)</label>
                  <input type="number" step="0.01" value={formData.minCgpa} onChange={e => setFormData({...formData, minCgpa: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Active Arrears (Optional)</label>
                  <input type="number" value={formData.maxActiveArrears} onChange={e => setFormData({...formData, maxActiveArrears: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Create Drive</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
