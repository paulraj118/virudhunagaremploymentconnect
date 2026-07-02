'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COLLEGES } from '@/lib/collegeConstants';

// SVGs for styling exactly matching the requested design
const GraduationCapIcon = () => <svg className="w-8 h-8 text-[#5C3CFA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/></svg>;
const BuildingIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>;
const TagIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const MailIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
const PhoneIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>;
const MapPinIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const MapIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>;
const BankIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>;
const LockIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>;
const EyeIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const EyeOffIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>;
const ShieldCheckIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>;

const SuccessIcon = () => (
  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
];
const STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Maharashtra", "Delhi", "Others"];

export default function CollegeRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    collegeName: '', collegeCode: '', contactPerson: '',
    email: '', mobile: '', address: '', district: '', state: '',
    password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (password) => {
    if (!password) return '';
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 1;
    
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Medium';
    if (strength === 3) return 'Strong';
    return 'Weak';
  };

  const validateField = (name, value, currentFormData = formData) => {
    let error = '';
    const val = value.trim();
    
    switch (name) {
      case 'collegeName': {
        const isFromList = COLLEGES.some(c => c.toLowerCase() === val.toLowerCase());
        if (!val) error = 'College Name is required.';
        else if (isFromList) error = '';
        else if (val.length < 3) error = 'College Name must contain at least 3 characters.';
        else if (val.length > 100) error = 'Invalid College Name.';
        else if (/ {2,}/.test(value) || value.startsWith(' ')) error = 'Invalid College Name.';
        else if (!/^[A-Za-z0-9&.\-()', ]+$/.test(val)) error = 'Invalid College Name.';
        break;
      }
      case 'collegeCode':
        if (!val) error = 'College Code is required.';
        else if (val.length < 3 || val.length > 20) error = 'College Code must be between 3 and 20 characters.';
        else if (!/^[A-Z0-9]+$/.test(val)) error = 'Invalid College Code.';
        break;
      case 'contactPerson':
        if (!val) error = 'Contact Person is required.';
        else if (val.length < 3 || val.length > 60 || !/^[A-Za-z ]+$/.test(val)) error = 'Enter a valid Contact Person name.';
        break;
      case 'email':
        if (!val) error = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) error = 'Enter a valid Email Address.';
        break;
      case 'mobile':
        if (!val) error = 'Mobile Number is required.';
        else if (!/^[6-9]\d{9}$/.test(val)) error = 'Enter a valid Mobile Number.';
        break;
      case 'address':
        if (!val) error = 'Address is required.';
        else if (val.length < 10 || val.length > 250) error = 'Address must be between 10 and 250 characters.';
        break;
      case 'district':
        if (!val) error = 'District is required.';
        else if (val.length < 3 || !/^[A-Za-z ]+$/.test(val)) error = 'District must contain at least 3 characters and alphabets only.';
        break;
      case 'state':
        if (!val) error = 'State is required.';
        else if (val.length < 3 || !/^[A-Za-z ]+$/.test(val)) error = 'State must contain at least 3 characters and alphabets only.';
        break;
      case 'password':
        if (!val) error = 'Password is required.';
        else if (val.length < 8 || val.length > 32) error = 'Password must be between 8 and 32 characters.';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(val)) error = 'Password must contain uppercase, lowercase, number, and special character.';
        break;
      case 'confirmPassword':
        if (!val) error = 'Confirm Password is required.';
        else if (val !== currentFormData.password) error = 'Passwords do not match.';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    
    if (name === 'collegeCode') finalValue = value.toUpperCase().replace(/\s/g, '');
    if (name === 'email') finalValue = value.toLowerCase();

    const newFormData = { ...formData, [name]: finalValue };
    setFormData(newFormData);
    
    if (touched[name]) {
      setErrors({ ...errors, [name]: validateField(name, finalValue, newFormData) });
    }
    // Also revalidate confirmPassword if password changes
    if (name === 'password' && touched.confirmPassword) {
       setErrors(prev => ({ ...prev, confirmPassword: validateField('confirmPassword', newFormData.confirmPassword, newFormData) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setSuccessMsg('');

    // Validate all
    let newErrors = {};
    let isValid = true;
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      newErrors[key] = error;
      if (error) isValid = false;
    });

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (!isValid) return;

    setLoading(true);
    try {
      const res = await fetch('/api/college/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccessMsg('Registration completed successfully. Your account is waiting for Admin approval.');
        setTimeout(() => router.push('/college/login'), 2000);
      } else {
        if (data.message?.toLowerCase().includes('email')) {
          setErrors(prev => ({ ...prev, email: data.message }));
        } else if (data.message?.toLowerCase().includes('college code')) {
          setErrors(prev => ({ ...prev, collegeCode: data.message }));
        } else {
          setGlobalError(data.message || 'An error occurred');
        }
      }
    } catch (err) {
      setGlobalError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, name, iconObj, placeholder, type = 'text', isSelect = false, options = []) => {
    const hasError = touched[name] && errors[name];
    const isValid = touched[name] && !errors[name] && formData[name].length > 0;
    
    // For password fields, adjust the actual input type
    let inputType = type;
    if (name === 'password') inputType = showPassword ? 'text' : 'password';
    if (name === 'confirmPassword') inputType = showConfirmPassword ? 'text' : 'password';
    
    return (
      <div className="relative flex flex-col mb-1">
        <label className="block text-xs font-semibold text-slate-800 mb-1">{label} <span className="text-red-500">*</span></label>
        <div className="relative w-full flex items-center">
          <div className="absolute left-1.5 flex items-center justify-center w-7 h-7 bg-indigo-50 text-[#5C3CFA] rounded pointer-events-none">
            {iconObj}
          </div>
          
          {isSelect ? (
            <select
              name={name}
              value={formData[name]}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full py-1.5 pl-9 pr-7 border rounded-md focus:ring-2 focus:outline-none transition-colors appearance-none text-xs ${
                hasError ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 
                isValid ? 'border-emerald-500 focus:ring-emerald-200' : 
                'border-slate-300 focus:ring-indigo-500 bg-white'
              }`}
            >
              <option value="" disabled>{placeholder}</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <>
              <input 
                type={inputType} 
                name={name} 
                placeholder={placeholder}
                value={formData[name]}
                onChange={handleChange} 
                onBlur={handleBlur}
                list={(!isSelect && options.length > 0) ? `${name}-list` : undefined}
                className={`w-full py-1.5 pl-9 pr-7 border rounded-md focus:ring-2 focus:outline-none transition-colors text-xs ${
                  hasError ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 
                  isValid ? 'border-emerald-500 focus:ring-emerald-200' : 
                  'border-slate-300 focus:ring-indigo-500 bg-white'
                }`} 
              />
              {(!isSelect && options.length > 0) && (
                <datalist id={`${name}-list`}>
                  {options.map(opt => <option key={opt} value={opt} />)}
                </datalist>
              )}
            </>
          )}

          {/* Password Eye Toggle */}
          {(name === 'password' || name === 'confirmPassword') && (
            <button
              type="button"
              onClick={() => name === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
              className={`absolute top-1/2 -translate-y-1/2 ${(hasError || isValid) ? 'right-10' : 'right-3'} text-slate-400 hover:text-slate-600`}
            >
              {(name === 'password' ? showPassword : showConfirmPassword) ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}

          {/* Validation Icons (Take precedence over eye icon if there's error/success) */}
          {(hasError || isValid) && (
            <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none">
               {hasError ? <ErrorIcon /> : <SuccessIcon />}
            </div>
          )}
          
          {/* Select Chevron (if no validation icon) */}
          {isSelect && !hasError && !isValid && (
            <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          )}
        </div>
        
        {hasError && <p className="mt-1 text-[11px] text-red-600 font-medium leading-tight">{errors[name]}</p>}
        
        {name === 'password' && formData.password.length > 0 && (
          <div className="mt-1 flex justify-end text-[11px] font-medium text-slate-500">
            Strength: <span className={
              getPasswordStrength(formData.password) === 'Strong' ? 'text-emerald-600' :
              getPasswordStrength(formData.password) === 'Medium' ? 'text-amber-500' : 'text-red-500'
            }>{getPasswordStrength(formData.password)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/register-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#F8F9FF"
      }}
    >
      {/* Decorative background elements similar to screenshot */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-3xl opacity-60 translate-x-1/3 translate-y-1/3"></div>

      <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-2xl w-full relative z-10">
        
        {successMsg && (
          <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white p-3 text-center text-sm font-bold animate-in slide-in-from-top rounded-t-2xl">
            {successMsg}
          </div>
        )}

        <div className="mb-5 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
            <GraduationCapIcon />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">College Registration</h1>
          <p className="text-slate-500 text-xs mt-1.5">Register your institution to access candidate rankings</p>
          <div className="mt-6 mb-2 flex items-center justify-center opacity-50">
            <div className="h-px w-16 bg-slate-200"></div>
            <div className="w-1.5 h-1.5 bg-[#5C3CFA] rounded-full mx-1"></div>
            <div className="w-4 h-1 bg-[#5C3CFA] rounded-full mx-1"></div>
            <div className="w-1.5 h-1.5 bg-[#5C3CFA] rounded-full mx-1"></div>
            <div className="h-px w-16 bg-slate-200"></div>
          </div>
        </div>

        {globalError && <div className="mb-4 p-2.5 bg-red-50 text-red-600 rounded-lg text-xs text-center border border-red-100 font-medium">{globalError}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3" noValidate>
          {renderInput('College Name', 'collegeName', <BuildingIcon />, 'Select College Name', 'text', false, COLLEGES)}
          {renderInput('College Code', 'collegeCode', <TagIcon />, 'Enter college code')}
          {renderInput('Contact Person', 'contactPerson', <UserIcon />, 'Enter contact person name')}
          {renderInput('Email Address', 'email', <MailIcon />, 'Enter email address', 'email')}
          {renderInput('Mobile Number', 'mobile', <PhoneIcon />, 'Enter mobile number')}
          {renderInput('Address', 'address', <MapPinIcon />, 'Enter full address')}
          {renderInput('District', 'district', <MapIcon />, 'Select district', 'text', true, DISTRICTS)}
          {renderInput('State', 'state', <BankIcon />, 'Select state', 'text', true, STATES)}
          {renderInput('Password', 'password', <LockIcon />, 'Create password', 'password')}
          {renderInput('Confirm Password', 'confirmPassword', <LockIcon />, 'Confirm password', 'password')}

          <div className="md:col-span-2 mt-4">
            <button type="submit" disabled={loading} className="w-full bg-[#5C3CFA] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2 shadow-md shadow-indigo-200">
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <ShieldCheckIcon />
              )}
              {loading ? 'Registering...' : 'Register College'}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500 font-medium">
          Already have an account? <Link href="/college/login" className="text-[#5C3CFA] font-bold hover:text-indigo-800">Login here</Link>
        </p>
      </div>
    </div>
  );
}
