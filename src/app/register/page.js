'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Validation helpers ---

const sanitize = (str) => str.replace(/[<>]/g, '');

const validators = {
  name: (value) => {
    const v = value.trim();
    if (!v) return 'Full Name is required.';
    if (v.length < 3) return 'Full Name must be at least 3 characters.';
    if (v.length > 50) return 'Full Name cannot exceed 50 characters.';
    if (!/^[A-Za-z\s]+$/.test(v)) return 'Only letters and spaces are allowed.';
    return '';
  },
  mobile: (value) => {
    const v = value.trim();
    if (!v) return 'Mobile Number is required.';
    if (!/^\d{10}$/.test(v)) return 'Enter a valid 10-digit mobile number.';
    if (!/^[6-9]/.test(v)) return 'Mobile number must start with 6, 7, 8, or 9.';
    return '';
  },
  email: (value) => {
    const v = value.trim();
    if (!v) return 'Email Address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
  },
  password: (value) => {
    if (!value) return 'Password is required.';
    if (value.length < 8) return 'Password must be at least 8 characters.';
    if (value.length > 20) return 'Password cannot exceed 20 characters.';
    if (/\s/.test(value)) return 'Password must not contain spaces.';
    if (
      !/[A-Z]/.test(value) ||
      !/[a-z]/.test(value) ||
      !/[0-9]/.test(value) ||
      !/[^A-Za-z0-9]/.test(value)
    )
      return 'Password must contain uppercase, lowercase, number, and special character.';
    return '';
  },
  role: (value) => {
    if (!value) return 'Please select a role.';
    return '';
  },
};

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    role: 'student',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const validateField = useCallback((name, value) => {
    const validate = validators[name];
    return validate ? validate(value) : '';
  }, []);

  const validateAll = useCallback(() => {
    const errors = {};
    for (const key of Object.keys(formData)) {
      const msg = validateField(key, formData[key]);
      if (msg) errors[key] = msg;
    }
    return errors;
  }, [formData, validateField]);

  const isFormValid = useCallback(() => {
    return Object.keys(validateAll()).length === 0;
  }, [validateAll]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name === 'password' ? value : sanitize(value);
    setFormData((prev) => ({ ...prev, [name]: sanitized }));

    // Re-validate on change only if the field was already touched
    if (touched[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, sanitized) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched
    const allTouched = {};
    for (const key of Object.keys(formData)) allTouched[key] = true;
    setTouched(allTouched);

    // Run full validation
    const errors = validateAll();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    const payload = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      mobile: formData.mobile.trim(),
    };

    const res = await register(payload);
    if (res.success) {
      setSuccessMsg(res.message || 'Registration successful. Please login to continue.');
      setLoading(false);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      setError(res.message || 'Registration failed');
      setLoading(false);
    }
  };

  // Inline error component — renders only when field is touched and has an error
  const FieldError = ({ name }) => {
    if (!touched[name] || !fieldErrors[name]) return null;
    return <p className="text-red-500 text-xs font-semibold mt-1.5">{fieldErrors[name]}</p>;
  };

  // Border style helper — red border on error, default otherwise
  const inputBorder = (name) =>
    touched[name] && fieldErrors[name]
      ? 'border-red-400 focus:ring-red-400'
      : 'border-slate-200 focus:ring-purple-500';

  return (
    <div className="min-h-screen md:h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 selection:bg-purple-200 overflow-y-auto md:overflow-hidden relative z-0">
      {/* Mobile Page Background Image (visible only on screens < md) */}
      <div className="absolute inset-0 block md:hidden z-0 overflow-hidden pointer-events-none">
        <img 
          src="/images/register-background.png" 
          alt="Mobile Page Background" 
          className="w-full h-full object-cover blur-md scale-105"
          style={{ objectFit: 'cover', objectPosition: '80% center' }}
        />
        <div className="absolute inset-0 bg-slate-100/10"></div>
      </div>

      <div className="max-w-6xl w-full h-auto md:h-[95vh] md:max-h-[750px] bg-white/94 md:bg-white backdrop-blur-md md:backdrop-blur-none rounded-3xl shadow-2xl border border-slate-100/80 md:border-slate-100 flex flex-col md:flex-row overflow-hidden relative z-10">
        {/* Left Side (Form) */}
        <div className="w-full md:w-[43%] py-5 pl-4 pr-8 sm:py-6 sm:pl-6 sm:pr-8 lg:py-8 lg:pl-8 lg:pr-10 relative flex flex-col justify-center overflow-hidden">
          <Link href="/" className="absolute left-4 sm:left-6 top-8 text-slate-400 hover:text-purple-600 transition-colors p-2 rounded-full hover:bg-purple-50 flex items-center justify-center group z-20" title="Back to Home">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>

          <div className="relative z-10 w-full">
            <div className="text-center mb-3">
              <div className="w-12 h-12 bg-purple-600 rounded-xl mx-auto flex items-center justify-center mb-1.5 shadow-lg shadow-purple-200">
                <span className="text-white font-bold text-xl">J</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create an Account</h1>
              <p className="text-sm text-slate-500 mt-0.5">Join Job Fair to start your journey</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100 text-center relative z-10">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm mb-4 border border-green-100 text-center font-medium relative z-10">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} className={`w-full px-4 py-2.5 rounded-xl border text-black font-medium focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white transition-all ${inputBorder('name')}`} placeholder="John Doe" maxLength={50} />
                  <FieldError name="name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} className={`w-full px-4 py-2.5 rounded-xl border text-black font-medium focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white transition-all ${inputBorder('mobile')}`} placeholder="9876543210" maxLength={10} />
                  <FieldError name="mobile" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} className={`w-full px-4 py-2.5 rounded-xl border text-black font-medium focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white transition-all ${inputBorder('email')}`} placeholder="name@example.com" />
                <FieldError name="email" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} className={`w-full px-4 py-2.5 pr-12 rounded-xl border text-black font-medium focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white transition-all ${inputBorder('password')}`} placeholder="••••••••" maxLength={20} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-purple-600 transition-colors" tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                <FieldError name="password" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">I am registering as a</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer border rounded-xl p-2.5 flex flex-col items-center text-center transition-all ${formData.role === 'student' ? 'border-purple-600 bg-purple-50/70 text-purple-700' : 'border-slate-200 hover:border-purple-300 text-slate-600'}`}>
                    <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleChange} className="hidden" />
                    <span className="font-bold text-sm mb-0.5">Student / Candidate</span>
                    <span className="text-[10px] sm:text-xs opacity-80 leading-tight">Looking for jobs & assessments</span>
                  </label>
                  <label className={`cursor-pointer border rounded-xl p-2.5 flex flex-col items-center text-center transition-all ${formData.role === 'hr_company' ? 'border-purple-600 bg-purple-50/70 text-purple-700' : 'border-slate-200 hover:border-purple-300 text-slate-600'}`}>
                    <input type="radio" name="role" value="hr_company" checked={formData.role === 'hr_company'} onChange={handleChange} className="hidden" />
                    <span className="font-bold text-sm mb-0.5">HR / Company</span>
                    <span className="text-[10px] sm:text-xs opacity-80 leading-tight">Looking to hire talent</span>
                  </label>
                </div>
                <FieldError name="role" />
              </div>

              <button type="submit" disabled={loading || !isFormValid()} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-purple-200 transition-all mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-3">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-600 hover:text-purple-700 font-bold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side (Visual Theme) */}
        <div className="hidden md:flex md:w-[57%] relative flex-col justify-start p-10 lg:p-12 overflow-hidden select-none">
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full z-0" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}>
            <img 
              src="/images/register-background.png" 
              alt="Background Illustration" 
              className="w-full h-full object-cover block"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '95% center', margin: 0, padding: 0 }}
            />
            {/* Subtle white gradient overlay for readability of left-aligned text */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/5 to-transparent" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}></div>
          </div>

          {/* Logo Section */}
          <div className="z-10 flex items-center mb-10">
            <img 
              src="/theni-logo.png" 
              alt="Theni Employment Connect" 
              className="h-16 w-auto" 
              onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/200x80?text=Logo" }} 
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
      </div>
    </div>
  );
}

