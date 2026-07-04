'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const heroImages = [
  '/images/temple.jpg',
  '/images/dam.jpg',
  '/images/hills.jpg',
  '/images/fireworks.jpg'
];

// Animated Counter Hook
function useCountUp(target, duration = 2000, startCounting = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startCounting || target === 0) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, startCounting]);
  return count;
}

export default function LandingPage() {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState({ candidates: 0, companies: 0, jobs: 0, colleges: 0, offers: 0 });
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  // Animated counters
  const candidatesCount = useCountUp(stats.candidates, 2000, statsVisible);
  const companiesCount = useCountUp(stats.companies, 2000, statsVisible);
  const jobsCount = useCountUp(stats.jobs, 2000, statsVisible);
  const collegesCount = useCountUp(stats.colleges, 2000, statsVisible);
  const offersCount = useCountUp(stats.offers, 2000, statsVisible);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real-time stats
  useEffect(() => {
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats);
      })
      .catch(() => {});
  }, []);

  // Intersection Observer for stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans">
      {/* Header */}
      <header className="bg-white py-3 px-6 md:px-12 flex items-center justify-between shadow-sm sticky top-0 z-50">
        {/* Logo */}
        <div className="flex items-center">
          <img src="/new-logo.png" alt="Virudhunagar Employment Connect" className="h-16 w-auto"  />
        </div>



        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/login" className="px-6 py-2.5 rounded-md border border-slate-300 text-[#0B1E40] font-bold text-sm hover:bg-slate-50 transition-colors">
                Login
              </Link>
              <Link href="/register" className="px-6 py-2.5 rounded-md bg-[#8B1538] text-white font-bold text-sm hover:bg-[#6b102b] transition-colors shadow-sm">
                Register
              </Link>
            </>
          ) : (
            <>
              <Link href={user.role === 'student' ? '/student' : user.role === 'hr_company' ? '/company' : '/admin'} className="px-6 py-2.5 rounded-md border border-slate-300 text-[#0B1E40] font-bold text-sm hover:bg-slate-50 transition-colors">
                Dashboard
              </Link>
              <button onClick={logout} className="px-6 py-2.5 rounded-md bg-[#8B1538] text-white font-bold text-sm hover:bg-[#6b102b] transition-colors shadow-sm">
                Log Out
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full h-[600px] flex flex-col justify-center items-start px-6 md:px-12 overflow-hidden bg-slate-900">
        {/* Background Slider */}
        <div className="absolute inset-0 z-0 flex transition-transform duration-1000 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {heroImages.map((src, index) => (
            <div key={index} className="w-full h-full flex-shrink-0">
              <img src={src} alt={`Hero ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        
        {/* Gradient Overlay (Only on left side for text readability) */}
        <div className="absolute inset-y-0 left-0 w-full md:w-2/3 lg:w-1/2 z-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>

        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-6 md:left-12 z-20 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${currentSlide === index ? 'bg-[#8B1538] w-6' : 'bg-slate-300/70 hover:bg-slate-300'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        <div className="relative z-10 max-w-2xl pt-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#0B1E40] leading-[1.1] mb-6">
            Connecting <br />
            <span className="text-[#8B1538]">Talent</span> with <br />
            <span className="text-[#0B1E40]">Opportunity</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-700 font-medium mb-10">
            Find the right job. Build your career. <br />Grow with Virudhunagar.
          </p>


        </div>
      </section>

      {/* ========== SECTION 1: Real-Time Stats Counter ========== */}
      <section ref={statsRef} className="relative bg-gradient-to-r from-[#0B1E40] via-[#132d5e] to-[#0B1E40] py-16 -mt-1">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            {[
              { label: 'Candidates Registered', value: candidatesCount, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', suffix: '+' },
              { label: 'Companies Hiring', value: companiesCount, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', suffix: '+' },
              { label: 'Active Jobs', value: jobsCount, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', suffix: '+' },
              { label: 'Colleges Connected', value: collegesCount, icon: 'M12 14l9-5-9-5-9 5 9 5z', suffix: '+' },
              { label: 'Offers Extended', value: offersCount, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', suffix: '' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300">
                  <svg className="w-7 h-7 text-[#D4A843]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={stat.icon}></path></svg>
                </div>
                <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-1">
                  {stat.value}{stat.suffix}
                </p>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Subtle decorative line */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </section>

      {/* ========== SECTION 2: How It Works ========== */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#8B1538] font-bold text-sm uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1E40] tracking-tight">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-[#0B1E40]/10 via-[#8B1538]/30 to-[#0B1E40]/10 z-0"></div>
            {[
              { step: '01', title: 'Register & Build Profile', desc: 'Create your account, add your academic details, skills, and upload your resume to get started.', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
              { step: '02', title: 'Take Skill Assessments', desc: 'Complete self-assessments and technical tests to showcase your abilities to potential employers.', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
              { step: '03', title: 'Get Hired', desc: 'Apply for jobs, attend recruitment drives and interviews, and receive your offer letter directly.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 bg-[#F8F9FB] rounded-2xl p-8 text-center border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 group">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#0B1E40] to-[#132d5e] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={item.icon}></path></svg>
                </div>
                <span className="inline-block text-[#8B1538] text-xs font-extrabold tracking-widest uppercase mb-2">Step {item.step}</span>
                <h3 className="font-extrabold text-[#0B1E40] text-lg mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: For Candidates & Employers ========== */}
      <section className="py-20 px-6 bg-[#F8F9FB]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#8B1538] font-bold text-sm uppercase tracking-widest mb-2">Built For Everyone</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1E40] tracking-tight">One Platform, Two Powerful Experiences</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Candidates */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#0B1E40]/5 to-transparent rounded-bl-full"></div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B1E40] to-[#132d5e] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <h3 className="text-2xl font-extrabold text-[#0B1E40] mb-4">For Candidates</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">Everything you need to launch your career, all in one place.</p>
              <ul className="space-y-3 mb-8">
                {['Build a professional profile & resume', 'Take AI-powered skill assessments', 'Apply to multiple jobs instantly', 'Track your application status in real-time', 'Get ranked based on your skills'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    <span className="text-slate-600 text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B1E40] text-white font-bold text-sm rounded-xl hover:bg-[#132d5e] transition-colors shadow-sm">
                Register as Candidate
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </Link>
            </div>

            {/* For Employers */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#8B1538]/5 to-transparent rounded-bl-full"></div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B1538] to-[#6b102b] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
              <h3 className="text-2xl font-extrabold text-[#0B1E40] mb-4">For Employers</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">Hire the best talent from Virudhunagar district efficiently.</p>
              <ul className="space-y-3 mb-8">
                {['Post jobs and reach qualified candidates', 'Access AI-ranked candidate profiles', 'Conduct structured interviews', 'Manage your complete hiring pipeline', 'Extend offer letters digitally'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    <span className="text-slate-600 text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B1538] text-white font-bold text-sm rounded-xl hover:bg-[#6b102b] transition-colors shadow-sm">
                Register as Employer
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Popular Categories */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12 relative">
          <h2 className="text-3xl font-extrabold text-[#0B1E40] mb-3 tracking-tight">Popular Job Categories</h2>
          <p className="text-slate-500 font-medium">Explore jobs in top categories</p>
          <a href="#" className="hidden md:flex text-[#0B1E40] font-bold text-sm items-center gap-1 hover:underline absolute right-0 bottom-0">
            View All 
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { name: "IT & Software", jobs: "1,250 Jobs", icon: "monitor" },
            { name: "Banking & Finance", jobs: "980 Jobs", icon: "bank" },
            { name: "Manufacturing", jobs: "1,100 Jobs", icon: "factory" },
            { name: "Education", jobs: "850 Jobs", icon: "academic" },
            { name: "Healthcare", jobs: "760 Jobs", icon: "shield" },
            { name: "Sales & Marketing", jobs: "1,050 Jobs", icon: "chart" }
          ].map((cat, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center hover:shadow-xl hover:border-slate-200 transition-all cursor-pointer group">
              <div className="w-14 h-14 mb-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#0B1E40] group-hover:scale-110 transition-transform">
                {cat.icon === 'monitor' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>}
                {cat.icon === 'bank' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>}
                {cat.icon === 'factory' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>}
                {cat.icon === 'academic' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>}
                {cat.icon === 'shield' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>}
                {cat.icon === 'chart' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>}
              </div>
              <h3 className="font-extrabold text-[#0B1E40] text-[13px] text-center mb-1">{cat.name}</h3>
              <p className="text-slate-500 font-medium text-[11px]">{cat.jobs}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Why Choose */}
      <footer className="bg-[#0B1E40] text-white pt-20 pb-16 relative overflow-hidden mt-10">
        <h2 className="text-center text-3xl font-extrabold mb-16 tracking-tight">Why Choose Virudhunagar Employment Connect?</h2>
        
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-center relative z-10">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5 border border-white/10">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="font-extrabold text-sm mb-2">Local Opportunities</h3>
            <p className="text-white/60 text-xs font-medium">Find jobs in and around Virudhunagar</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5 border border-white/10">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h3 className="font-extrabold text-sm mb-2">Verified Employers</h3>
            <p className="text-white/60 text-xs font-medium">Connect with trusted companies</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5 border border-white/10">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </div>
            <h3 className="font-extrabold text-sm mb-2">Skill Assessments</h3>
            <p className="text-white/60 text-xs font-medium">Evaluate and grow your skills</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5 border border-white/10">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 className="font-extrabold text-sm mb-2">Career Support</h3>
            <p className="text-white/60 text-xs font-medium">Resources to build your future</p>
          </div>
        </div>

        {/* Decorative Temple Silhouette */}
        <div className="absolute bottom-0 left-0 w-full flex justify-center opacity-[0.03] pointer-events-none">
          <svg viewBox="0 0 1000 200" className="w-[150%] h-auto max-h-48 fill-white">
            {/* Simple abstract temple silhouette pattern */}
            <path d="M0,200 L1000,200 L1000,180 L950,180 L950,150 L920,150 L920,100 L900,100 L900,50 L880,50 L880,0 L850,0 L850,50 L830,50 L830,100 L810,100 L810,150 L780,150 L780,180 L700,180 L700,140 L680,140 L680,80 L650,80 L650,40 L630,40 L630,0 L600,0 L600,40 L580,40 L580,80 L550,80 L550,140 L530,140 L530,180 L480,180 L480,120 L460,120 L460,70 L430,70 L430,30 L410,30 L410,0 L380,0 L380,30 L360,30 L360,70 L330,70 L330,120 L310,120 L310,180 L250,180 L250,150 L230,150 L230,90 L200,90 L200,50 L180,50 L180,20 L150,20 L150,50 L130,50 L130,90 L100,90 L100,150 L80,150 L80,180 L0,180 Z" />
          </svg>
        </div>
      </footer>
    </div>
  );
}
