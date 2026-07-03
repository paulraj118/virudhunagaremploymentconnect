'use client';

import { useState, useEffect } from 'react';

export default function CollegeProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/college/profile', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setProfile(data.college);
        setForm({
          collegeName: data.college.collegeName || '',
          contactPerson: data.college.contactPerson || '',
          mobile: data.college.mobile || '',
          address: data.college.address || '',
          district: data.college.district || '',
          state: data.college.state || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/college/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.college);
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Update failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">Unable to load profile.</p>
      </div>
    );
  }

  const statusColors = {
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  const fields = [
    { key: 'collegeName', label: 'College Name', icon: '🏫' },
    { key: 'contactPerson', label: 'Contact Person', icon: '👤' },
    { key: 'email', label: 'Email Address', icon: '✉️', readonly: true },
    { key: 'collegeCode', label: 'College Code', icon: '🔑', readonly: true },
    { key: 'mobile', label: 'Mobile Number', icon: '📱' },
    { key: 'address', label: 'Address', icon: '📍' },
    { key: 'district', label: 'District', icon: '🗺️' },
    { key: 'state', label: 'State', icon: '🏛️' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black backdrop-blur-sm border border-white/10">
              {profile.collegeName?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black">{profile.collegeName}</h1>
              <p className="text-indigo-200 text-sm font-medium mt-0.5">College Code: {profile.collegeCode}</p>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${statusColors[profile.approvalStatus] || statusColors.Pending}`}>
            {profile.approvalStatus || 'Pending'}
          </span>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">College Information</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100"
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving ? 'Saving...' : '✅ Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({
                    collegeName: profile.collegeName || '',
                    contactPerson: profile.contactPerson || '',
                    mobile: profile.mobile || '',
                    address: profile.address || '',
                    district: profile.district || '',
                    state: profile.state || '',
                  });
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map(field => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{field.icon}</span> {field.label}
                </label>
                {editing && !field.readonly ? (
                  <input
                    type="text"
                    value={form[field.key] || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 transition-all"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                    {profile[field.key] || '-'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timestamps */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-6 text-xs text-slate-400 font-medium">
          <span>
            📅 Registered: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
          </span>
          <span>
            🔄 Last Updated: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
