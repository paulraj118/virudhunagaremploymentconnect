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

        {successMsg && (
          <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm mb-6 border border-green-100 text-center font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} className={`w-full px-4 py-3 rounded-xl border text-black font-medium focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white transition-all ${inputBorder('name')}`} placeholder="John Doe" maxLength={50} />
              <FieldError name="name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label>
              <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} className={`w-full px-4 py-3 rounded-xl border text-black font-medium focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white transition-all ${inputBorder('mobile')}`} placeholder="9876543210" maxLength={10} />
              <FieldError name="mobile" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} className={`w-full px-4 py-3 rounded-xl border text-black font-medium focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white transition-all ${inputBorder('email')}`} placeholder="name@example.com" />
            <FieldError name="email" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} className={`w-full px-4 py-3 pr-12 rounded-xl border text-black font-medium focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white transition-all ${inputBorder('password')}`} placeholder="••••••••" maxLength={20} />
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
            <FieldError name="role" />
          </div>

          <button type="submit" disabled={loading || !isFormValid()} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
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

