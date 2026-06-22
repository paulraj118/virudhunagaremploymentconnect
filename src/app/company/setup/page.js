'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function CompanySetup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    companyName: '',
    hrName: '',
    website: '',
    address: '',
    linkedIn: '',
    description: '',
    industryType: 'IT Services',
    companySize: '1-50',
    logoUrl: '',
    supportEmail: '',
    supportPhone: '',
    esiCertificateUrl: '',
    itCertificateUrl: '',
    incCertificateUrl: '',
    dpiitNumber: ''
  });

  const [isRegistered, setIsRegistered] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const res = await fetch('/api/company/profile', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.company) {
        setIsRegistered(true);
        setFormData({
          companyName: data.company.companyName || '',
          hrName: data.company.hrName || '',
          website: data.company.website || '',
          address: data.company.address || '',
          linkedIn: data.company.linkedIn || '',
          description: data.company.description || '',
          industryType: data.company.industryType || 'IT Services',
          companySize: data.company.companySize || '1-50',
          logoUrl: data.company.logoUrl || '',
          supportEmail: data.company.supportEmail || '',
          supportPhone: data.company.supportPhone || '',
          esiCertificateUrl: data.company.esiCertificateUrl || '',
          itCertificateUrl: data.company.itCertificateUrl || '',
          incCertificateUrl: data.company.incCertificateUrl || '',
          dpiitNumber: data.company.dpiitNumber || ''
        });
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const method = isRegistered ? 'PUT' : 'POST';
      const res = await fetch('/api/company/profile', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setIsRegistered(true);
        setEditMode(false);
        setMessage(isRegistered ? 'Company profile updated successfully!' : 'Company registered successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to save profile');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limit file size to 2MB for logos
      if (file.size > 2 * 1024 * 1024) {
        setMessage('Logo size must be less than 2MB');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertificateUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Limit file size to 4MB
      if (file.size > 4 * 1024 * 1024) {
        setMessage('File size must be less than 4MB');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [fieldName]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const [previewCert, setPreviewCert] = useState(null);

  const viewCertificate = (dataUrl, label) => {
    if (!dataUrl) return;
    // Check if it's a PDF
    if (dataUrl.startsWith('data:application/pdf')) {
      // Download PDF
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${label}.pdf`;
      link.click();
    } else {
      // Show image in preview modal
      setPreviewCert({ url: dataUrl, label });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Company Setup</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your company branding and contact information.</p>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-xl font-bold ${message.includes('success') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-8">
        
        {/* Branding Section */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Company Branding
            </h2>
            {!editMode && (
              <button type="button" onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#0B1E40] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Edit
              </button>
            )}
            {editMode && (
              <button type="button" onClick={() => setEditMode(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 items-start mb-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Change Logo</span>
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-bold text-slate-700 mb-2">About Us / Description</label>
              <textarea 
                rows="4" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                readOnly={!editMode}
                className={`w-full px-5 py-3 rounded-xl border border-slate-200 outline-none font-medium resize-none ${editMode ? 'focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white' : 'bg-slate-50 cursor-default'}`}
                placeholder="Write a short description about your company, culture, and vision..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* General Info */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              General Information
            </h2>
            {!editMode && (
              <button type="button" onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#0B1E40] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Edit
              </button>
            )}
            {editMode && (
              <button type="button" onClick={() => setEditMode(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
              <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} readOnly={!editMode} className={`w-full px-5 py-3 rounded-xl border border-slate-200 outline-none font-medium ${editMode ? 'focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white' : 'bg-slate-50 cursor-default'}`} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">HR Manager Name</label>
              <input type="text" value={formData.hrName} onChange={e => setFormData({...formData, hrName: e.target.value})} readOnly={!editMode} className={`w-full px-5 py-3 rounded-xl border border-slate-200 outline-none font-medium ${editMode ? 'focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white' : 'bg-slate-50 cursor-default'}`} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Industry Type</label>
              <select value={formData.industryType} onChange={e => setFormData({...formData, industryType: e.target.value})} disabled={!editMode} className={`w-full px-5 py-3 rounded-xl border border-slate-200 outline-none font-medium appearance-none ${editMode ? 'focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white' : 'bg-slate-50 cursor-default'}`}>
                <option value="IT Services">IT Services</option>
                <option value="Product Based">Product Based</option>
                <option value="Fintech">Fintech</option>
                <option value="EdTech">EdTech</option>
                <option value="Healthcare">Healthcare</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Company Size</label>
              <select value={formData.companySize} onChange={e => setFormData({...formData, companySize: e.target.value})} disabled={!editMode} className={`w-full px-5 py-3 rounded-xl border border-slate-200 outline-none font-medium appearance-none ${editMode ? 'focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white' : 'bg-slate-50 cursor-default'}`}>
                <option value="1-50">1-50 Employees</option>
                <option value="51-200">51-200 Employees</option>
                <option value="201-500">201-500 Employees</option>
                <option value="500+">500+ Employees</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              Contact & Links
            </h2>
            {!editMode && (
              <button type="button" onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#0B1E40] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Edit
              </button>
            )}
            {editMode && (
              <button type="button" onClick={() => setEditMode(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Support Email</label>
              <input type="email" placeholder="hr@company.com" value={formData.supportEmail} onChange={e => setFormData({...formData, supportEmail: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Support Phone</label>
              <input type="tel" placeholder="+91 XXXXX XXXXX" value={formData.supportPhone} onChange={e => setFormData({...formData, supportPhone: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Website</label>
              <input type="url" placeholder="https://..." value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">LinkedIn</label>
              <input type="url" placeholder="https://linkedin.com/..." value={formData.linkedIn} onChange={e => setFormData({...formData, linkedIn: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-medium" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Office Address</label>
            <textarea 
              rows="2" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-medium resize-none"
            ></textarea>
          </div>
        </div>

        {/* Compliance & Certificates Section (Optional) */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            Compliance & Certificates
          </h2>
          <p className="text-sm text-slate-400 mb-6">These fields are optional. Upload only if applicable to your company.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* ESI Certificate */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ESI Certificate <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
              <div className="relative">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleCertificateUpload(e, 'esiCertificateUrl')} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-medium text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
                {formData.esiCertificateUrl && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-emerald-600 font-semibold">✓ File uploaded</span>
                    <button type="button" onClick={() => viewCertificate(formData.esiCertificateUrl, 'ESI_Certificate')} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline">View</button>
                  </div>
                )}
              </div>
            </div>

            {/* IT Last Year Certificate */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">IT Certificate (Last Year) <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
              <div className="relative">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleCertificateUpload(e, 'itCertificateUrl')} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-medium text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
                {formData.itCertificateUrl && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-emerald-600 font-semibold">✓ File uploaded</span>
                    <button type="button" onClick={() => viewCertificate(formData.itCertificateUrl, 'IT_Certificate')} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline">View</button>
                  </div>
                )}
              </div>
            </div>

            {/* INC Certificate */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">INC Certificate <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
              <div className="relative">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleCertificateUpload(e, 'incCertificateUrl')} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-medium text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
                {formData.incCertificateUrl && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-emerald-600 font-semibold">✓ File uploaded</span>
                    <button type="button" onClick={() => viewCertificate(formData.incCertificateUrl, 'INC_Certificate')} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline">View</button>
                  </div>
                )}
              </div>
            </div>

            {/* DPIIT Number */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">DPIIT Number <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
              <input type="text" placeholder="Enter DPIIT Registration Number" value={formData.dpiitNumber} onChange={e => setFormData({...formData, dpiitNumber: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-medium" />
            </div>
          </div>
        </div>

        {editMode && (
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditMode(false)} className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="bg-[#0B1E40] hover:bg-[#152d54] text-white font-semibold py-2.5 px-8 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

      </form>

      {/* Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setPreviewCert(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{previewCert.label.replace(/_/g, ' ')}</h3>
              <button onClick={() => setPreviewCert(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100">
              <img src={previewCert.url} alt={previewCert.label} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md" />
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <a href={previewCert.url} download={`${previewCert.label}.png`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold">
                Download
              </a>
              <button onClick={() => setPreviewCert(null)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
