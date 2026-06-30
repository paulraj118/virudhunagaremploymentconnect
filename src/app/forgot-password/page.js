'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok || data.success) {
        setMessage(data.message || 'If the email is registered, a password reset link will be sent shortly.');
        setEmail('');
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100 relative">
        <Link href="/login" className="absolute left-6 top-8 text-slate-400 hover:text-indigo-650 transition-colors p-2 rounded-full hover:bg-slate-50 flex items-center justify-center group" title="Back to Login">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        
        <div className="text-center mb-8 mt-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-100">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m-5-4v12m0-12a2 2 0 00-2 2v8a2 2 0 002 2h3a2 2 0 002-2V9a2 2 0 00-2-2h-3"></path></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Forgot Password</h1>
          <p className="text-sm text-slate-500 mt-2">Enter your email and we'll send you a password reset link</p>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-3.5 rounded-xl text-sm font-semibold mb-6 border border-rose-100 text-center">{error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-xl text-sm font-semibold mb-6 border border-emerald-100 text-center">{message}</div>}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                placeholder="name@example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-center text-sm text-slate-500 mt-8">
          Remember your password?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
