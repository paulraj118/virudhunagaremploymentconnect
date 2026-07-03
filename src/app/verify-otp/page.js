'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function OTPVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') || '';
  const role = searchParams.get('role') || '';
  const loginType = searchParams.get('loginType') || 'general';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Redirect if no email/role
  useEffect(() => {
    if (!email || !role) {
      router.push('/login');
    }
  }, [email, role, router]);

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}${name[1]}***${name[name.length - 1]}@${domain}`;
  };

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = loginType === 'college'
        ? '/api/college/otp/verify'
        : '/api/auth/otp/verify';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('OTP verified successfully! Redirecting...');

        // Store token in sessionStorage for general login
        if (data.token) {
          sessionStorage.setItem('jf_token', data.token);
        }
        if (data.user) {
          sessionStorage.setItem('jf_user', JSON.stringify(data.user));
          sessionStorage.setItem('jf_expected_role', data.user.role);
        }

        // Redirect based on role
        setTimeout(() => {
          if (loginType === 'college') {
            window.location.href = '/college/dashboard';
          } else if (role === 'hr_company') {
            window.location.href = '/company';
          } else if (role === 'student') {
            window.location.href = '/student';
          } else {
            window.location.href = '/';
          }
        }, 1000);
      } else {
        setError(data.message || 'Invalid OTP');
        
        // If max attempts or expired, redirect back to login
        if (data.maxAttempts || data.expired) {
          setTimeout(() => {
            if (loginType === 'college') {
              router.push('/college/login');
            } else {
              router.push('/login');
            }
          }, 2500);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setError('');

    try {
      const apiUrl = loginType === 'college'
        ? '/api/college/otp/resend'
        : '/api/auth/otp/resend';

      const body = loginType === 'college'
        ? { email }
        : { email, role };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setOtp(['', '', '', '', '', '']);
        setCountdown(60);
        setCanResend(false);
        setSuccess('New OTP sent to your email!');
        inputRefs.current[0]?.focus();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email || !role) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>

      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg shadow-indigo-200/50">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Verify Your Identity</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Enter the 6-digit OTP sent to<br />
            <span className="font-bold text-indigo-600">{maskEmail(email)}</span>
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-3.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm text-center border border-emerald-100 font-semibold flex items-center justify-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-50 text-red-600 rounded-xl text-sm text-center border border-red-100 font-semibold flex items-center justify-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}

        {/* OTP Input Boxes */}
        <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                digit
                  ? 'border-indigo-400 bg-indigo-50/50 text-indigo-700 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-800'
              } focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100`}
              disabled={loading || !!success}
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6 || !!success}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verify OTP
            </>
          )}
        </button>

        {/* Resend Section */}
        <div className="mt-6 text-center">
          {!canResend ? (
            <p className="text-sm text-slate-500">
              Resend OTP in{' '}
              <span className="font-black text-indigo-600 tabular-nums">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 mx-auto"
            >
              {resendLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Resend OTP
                </>
              )}
            </button>
          )}
        </div>

        {/* Timer Visual */}
        {!canResend && (
          <div className="mt-4 mx-auto w-full max-w-[200px]">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 60) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link
            href={loginType === 'college' ? '/college/login' : '/login'}
            className="text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OTPVerificationContent />
    </Suspense>
  );
}
