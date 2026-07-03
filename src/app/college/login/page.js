'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Icons ---
const GraduationCapIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v7" />
  </svg>
);
const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default function CollegeLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/college/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.otpRequired) {
        // Redirect to OTP verification page
        window.location.href = `/verify-otp?email=${encodeURIComponent(data.email)}&role=college&loginType=college`;
      } else if (data.success) {
        window.location.href = '/college/dashboard';
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, name, iconObj, placeholder, type = 'text') => {
    let inputType = type;
    if (name === 'password') inputType = showPassword ? 'text' : 'password';

    return (
      <div className="relative flex flex-col mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-xs font-semibold text-slate-800">{label}</label>
          {name === 'password' && (
            <Link href="/forgot-password" className="text-[10px] font-bold text-[#5C3CFA] hover:underline">
              Forgot Password?
            </Link>
          )}
        </div>
        <div className="relative w-full flex items-center">
          <div className="absolute left-1.5 flex items-center justify-center w-7 h-7 bg-indigo-50 text-[#5C3CFA] rounded pointer-events-none">
            {iconObj}
          </div>
          <input 
            type={inputType} 
            name={name} 
            placeholder={placeholder}
            value={formData[name]}
            onChange={handleChange} 
            required
            className="w-full py-2 pl-10 pr-8 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors text-sm bg-white"
          />
          {name === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-[#5C3CFA] transition-colors"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/login-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#F8F9FF"
      }}
    >
      {/* Decorative background elements similar to screenshot */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-3xl opacity-60 translate-x-1/3 translate-y-1/3"></div>

      <div className="bg-white p-7 sm:p-9 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-md w-full relative z-10">
        
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
            <GraduationCapIcon />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">College Login</h1>
          <p className="text-slate-500 text-xs mt-1.5">Access your candidate rankings</p>
          
          <div className="mt-5 mb-2 flex items-center justify-center opacity-50">
            <div className="h-px w-12 bg-slate-200"></div>
            <div className="w-1 h-1 bg-[#5C3CFA] rounded-full mx-1"></div>
            <div className="w-4 h-0.5 bg-[#5C3CFA] rounded-full mx-1"></div>
            <div className="w-1 h-1 bg-[#5C3CFA] rounded-full mx-1"></div>
            <div className="h-px w-12 bg-slate-200"></div>
          </div>
        </div>

        {error && <div className="mb-5 p-2.5 bg-red-50 text-red-600 rounded-lg text-xs text-center border border-red-100 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col">
          {renderInput('Email Address', 'email', <MailIcon />, 'Enter your email', 'email')}
          {renderInput('Password', 'password', <LockIcon />, 'Enter your password', 'password')}

          <button type="submit" disabled={loading} className="w-full bg-[#5C3CFA] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2 shadow-md shadow-indigo-200 mt-4">
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <ShieldCheckIcon />
            )}
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500 font-medium">
          New institution? <Link href="/college/register" className="text-[#5C3CFA] font-bold hover:text-indigo-800">Register here</Link>
        </p>
      </div>
    </div>
  );
}
