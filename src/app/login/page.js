'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.directLogin) {
        // Admin: direct login (no OTP) — cookie already set by server
        if (data.token) {
          sessionStorage.setItem('jf_token', data.token);
        }
        sessionStorage.setItem('jf_user', JSON.stringify(data.user));
        sessionStorage.setItem('jf_expected_role', data.user.role);
        
        const role = data.user.role;
        if (role === 'super_admin') window.location.href = '/admin';
        else if (role === 'hr_company') window.location.href = '/company';
        else if (role === 'student') window.location.href = '/student';
        else if (role === 'college') window.location.href = '/college/dashboard';
        else window.location.href = '/';
      } else if (data.otpRequired) {
        // Student/HR: redirect to OTP page
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}&role=${encodeURIComponent(data.role)}&loginType=general`);
      } else {
        setError(data.message || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-purple-200">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side (Visual Panel) */}
        <div className="hidden md:flex md:w-[55%] relative flex-col justify-start items-end p-10 lg:p-12 overflow-hidden select-none">
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full z-0" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}>
            <img 
              src="/images/login-background.png" 
              alt="Login Background" 
              className="w-full h-full object-cover block"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '20% center', margin: 0, padding: 0 }}
            />
            {/* Subtle white gradient overlay for readability of right-aligned text */}
            <div className="absolute inset-0 bg-gradient-to-l from-white/40 via-white/5 to-transparent" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}></div>
          </div>

          {/* Logo Section */}
          <div className="z-10 flex items-center mb-10 mr-8">
            <img 
              src="/logo.png" 
              alt="Virudhunagar Employment Connect" 
              className="h-16 w-auto" 
               
            />
          </div>

          {/* Slogan and Quotes */}
          <div className="z-10 max-w-sm flex flex-col justify-start text-left">
            <h2 className="text-3xl font-extrabold text-[#0B1E40] tracking-tight leading-tight">
              Start Your Career<br />Journey Today
            </h2>
            <div className="w-12 h-1 bg-[#D4AF37] my-5 rounded-full"></div>
            
            <div className="flex items-start mt-2">
              <span className="text-4xl font-serif text-[#C5A85C] leading-none select-none mr-2">“</span>
              <p className="text-[#0B1E40]/90 font-bold text-[14px] leading-relaxed pt-1.5">
                Create Your Profile.<br />Discover New Opportunities.
              </p>
              <span className="text-4xl font-serif text-[#C5A85C] leading-none select-none ml-1 align-bottom self-end">”</span>
            </div>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-[45%] p-8 relative flex flex-col justify-center">
          <div className="text-center mb-8">
            <Link href="/" className="absolute left-6 top-8 text-slate-400 hover:text-purple-600 transition-colors p-2 rounded-full hover:bg-purple-50 flex items-center justify-center group" title="Back to Home">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </Link>
            <div className="w-12 h-12 bg-purple-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-slate-500 mt-2">Sign in to access your portal</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                placeholder="name@example.com"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don't have an account?{' '}
            <Link href="/register" className="text-purple-600 hover:text-purple-700 font-bold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
