'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    companyCode: '',
    hrName: '',
    hrEmail: '',
    mobileNumber: '',
    companyAddress: '',
    industry: '',
    companyWebsite: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/company/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        router.push('/company/login');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800">Company Registration</h1>
          <p className="text-slate-500 text-sm mt-1">Register your organization to recruit top candidates.</p>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-semibold mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name *</label>
              <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Code (Unique) *</label>
              <input required type="text" value={formData.companyCode} onChange={e => setFormData({...formData, companyCode: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">HR Name *</label>
              <input required type="text" value={formData.hrName} onChange={e => setFormData({...formData, hrName: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">HR Email *</label>
              <input required type="email" value={formData.hrEmail} onChange={e => setFormData({...formData, hrEmail: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number *</label>
              <input required type="tel" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Industry *</label>
              <input required type="text" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Address *</label>
              <textarea required value={formData.companyAddress} onChange={e => setFormData({...formData, companyAddress: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" rows="2"></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Website</label>
              <input type="url" value={formData.companyWebsite} onChange={e => setFormData({...formData, companyWebsite: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password *</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm Password *</label>
              <input required type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" />
            </div>
          </div>
          <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors mt-6">
            {loading ? 'Registering...' : 'Submit Registration'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already registered? <a href="/company/login" className="text-indigo-600 font-bold hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
}
