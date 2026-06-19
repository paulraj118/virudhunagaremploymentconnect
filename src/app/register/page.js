'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register(formData);
    if (res.success) {
      if (res.user?.role === 'hr_company') {
        router.push('/company');
      } else {
        router.push('/student');
      }
    } else {
      setError(res.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-purple-200 py-12">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 relative">
        <div className="text-center mb-8">
          <Link href="/" className="absolute left-6 top-8 text-slate-400 hover:text-purple-600 transition-colors p-2 rounded-full hover:bg-purple-50 flex items-center justify-center group" title="Back to Home">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <div className="w-12 h-12 bg-purple-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
            <span className="text-white font-bold text-xl">J</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create an Account</h1>
          <p className="text-sm text-slate-500 mt-2">Join Job Fair to start your journey</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition-all" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label>
              <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition-all" placeholder="+1 234 567 8900" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition-all" placeholder="name@example.com" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition-all" placeholder="••••••••" minLength="6" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">I am registering as a</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center text-center transition-all ${formData.role === 'student' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 hover:border-purple-300 text-slate-600'}`}>
                <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleChange} className="hidden" />
                <span className="font-bold mb-1">Student / Candidate</span>
                <span className="text-xs opacity-80">Looking for jobs & assessments</span>
              </label>
              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center text-center transition-all ${formData.role === 'hr_company' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 hover:border-purple-300 text-slate-600'}`}>
                <input type="radio" name="role" value="hr_company" checked={formData.role === 'hr_company'} onChange={handleChange} className="hidden" />
                <span className="font-bold mb-1">HR / Company</span>
                <span className="text-xs opacity-80">Looking to hire talent</span>
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-600 hover:text-purple-700 font-bold">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
