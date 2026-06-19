'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen font-sans overflow-hidden relative transition-colors duration-500 ${isDark ? 'bg-[#0B0F19] text-slate-200 selection:bg-purple-500/30' : 'bg-[#FAFAFF] text-slate-800 selection:bg-purple-200'}`}>
      
      {/* Background Glow Effects */}
      <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[120px] rounded-full pointer-events-none transition-colors duration-500 ${isDark ? 'bg-purple-600/20' : 'bg-purple-300/30 mix-blend-multiply'}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[120px] rounded-full pointer-events-none transition-colors duration-500 ${isDark ? 'bg-indigo-600/15' : 'bg-indigo-300/25 mix-blend-multiply'}`}></div>
      {!isDark && (
        <div className="absolute top-[20%] right-[20%] w-[35%] h-[35%] bg-pink-200/30 blur-[120px] rounded-full pointer-events-none mix-blend-multiply"></div>
      )}

      {/* Navigation */}
      <nav className={`fixed w-full z-50 top-0 transition-all duration-300 backdrop-blur-xl border-b ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-slate-200/60 shadow-[0_4px_30px_rgba(0,0,0,0.02)]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${isDark ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-purple-500/30' : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30'}`}>
                <span className="text-white font-black text-xl">J</span>
              </div>
              <span className={`font-extrabold text-2xl tracking-tight transition-colors ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300' : 'text-slate-900 drop-shadow-sm'}`}>
                Job Fair
              </span>
            </div>
            
            <div className="flex items-center space-x-4 md:space-x-6">
              <button onClick={toggleTheme} className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${isDark ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105 shadow-sm'}`}>
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                )}
              </button>

              {!user ? (
                <>
                  <Link href="/login" className={`font-bold transition-colors duration-300 hidden sm:block ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-indigo-600'}`}>
                    Log In
                  </Link>
                  <Link href="/register" className="relative inline-flex h-11 items-center justify-center px-6 py-2 font-bold text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:scale-105 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50">
                    Register Now
                  </Link>
                </>
              ) : (
                <>
                  <Link href={user.role === 'student' ? '/student' : user.role === 'hr_company' ? '/company' : '/admin'} className="font-bold text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-full transition-all border border-indigo-100 shadow-sm">
                    Dashboard
                  </Link>
                  <button onClick={logout} className={`font-bold px-5 py-2.5 rounded-full transition-all duration-300 border ${isDark ? 'bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-slate-300 border-white/10' : 'bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 border-slate-200 shadow-sm'}`}>
                    Log Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Text Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-bold animate-fade-in shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-purple-300' : 'bg-white border-indigo-100 text-indigo-700 shadow-indigo-100/50'}`}>
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDark ? 'bg-purple-400' : 'bg-indigo-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isDark ? 'bg-purple-500' : 'bg-indigo-600'}`}></span>
              </span>
              AI-Powered Competency & Placements
            </div>
            
            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
              The Smarter Way To <br />
              Get Hired & <span className={`text-transparent bg-clip-text bg-gradient-to-r drop-shadow-sm ${isDark ? 'from-indigo-400 via-purple-400 to-pink-400' : 'from-indigo-600 via-purple-600 to-pink-600'}`}>Verify Talent</span>
            </h1>
            
            <p className={`text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed transition-colors font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Job Fair unites job seekers and top recruiters in a modern, secure, and proctored environment. Upload your resume, prove your technical skills, and secure placement with ease.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 items-center">
              {!user ? (
                <Link href="/register" className="relative group w-full sm:w-auto">
                  <div className={`absolute -inset-1 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 ${isDark ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gradient-to-r from-indigo-400 to-purple-400'}`}></div>
                  <button className="relative w-full flex justify-center items-center gap-3 px-8 py-4 rounded-full font-bold text-base transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20">
                    Get Started Now
                    <svg className="w-5 h-5 text-indigo-200 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                  </button>
                </Link>
              ) : (
                <Link href={user.role === 'student' ? '/student' : user.role === 'hr_company' ? '/company' : '/admin'} className="relative group w-full sm:w-auto">
                  <button className="w-full flex justify-center items-center gap-3 px-8 py-4 rounded-full font-bold text-base transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl">
                    Go to Workspace
                    <svg className="w-5 h-5 text-indigo-200 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                  </button>
                </Link>
              )}
              <Link href="/login" className={`w-full sm:w-auto px-8 py-4 rounded-full font-bold text-base border transition-all text-center ${isDark ? 'text-white bg-white/5 hover:bg-white/10 border-white/10' : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-sm'}`}>
                Explore Portal
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="pt-6 border-t border-slate-200/50 dark:border-white/5 flex flex-wrap justify-center lg:justify-start gap-8 text-center lg:text-left">
              <div>
                <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">96%</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Placement Rate</span>
              </div>
              <div className="border-r border-slate-200/60 dark:border-white/5 hidden sm:block"></div>
              <div>
                <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">10,000+</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Students</span>
              </div>
              <div className="border-r border-slate-200/60 dark:border-white/5 hidden sm:block"></div>
              <div>
                <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">250+</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hiring Companies</span>
              </div>
            </div>
          </div>

          {/* Right Hero Interactive Mockup Graphic */}
          <div className="lg:col-span-5 relative h-[450px] w-full flex items-center justify-center lg:justify-end">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl opacity-60"></div>
            
            {/* Main Center Window Mockup */}
            <div className={`relative w-[340px] bg-slate-900 border border-white/10 rounded-[2rem] p-6 shadow-2xl z-10 transition-transform hover:scale-[1.02] duration-500`}>
              <div className="flex items-center gap-1.5 mb-5 border-b border-white/5 pb-3">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500"></span>
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-slate-500 ml-2 font-mono">jobfair-workspace</span>
              </div>
              
              <div className="space-y-4">
                <div className="h-4 bg-white/10 rounded-md w-3/4"></div>
                <div className="h-4 bg-white/5 rounded-md w-1/2"></div>
                <div className="flex gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">React</span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 text-[10px] font-bold border border-purple-500/20">Python</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">IT Track</span>
                </div>
                <div className="h-px bg-white/5 my-4"></div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Verification Stage</span>
                  <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-[10px] uppercase">Shortlisted</span>
                </div>
              </div>
            </div>

            {/* Floating Badge Card 1 */}
            <div className="absolute top-2 left-6 bg-white/95 dark:bg-slate-800/95 border border-slate-200/60 dark:border-white/10 rounded-[1.5rem] p-5 shadow-2xl w-64 animate-[float_6s_ease-in-out_infinite] z-20">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">✓</div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">Proctored Assessment</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Technical exam verified</p>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-slate-100 dark:border-white/5 pt-2.5">
                <span className="text-xl font-black text-slate-800 dark:text-white">92% <span className="text-[10px] text-slate-400 font-bold">Grade</span></span>
                <span className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Pass</span>
              </div>
            </div>

            {/* Floating Badge Card 2 */}
            <div className="absolute bottom-6 right-6 bg-white/95 dark:bg-slate-800/95 border border-slate-200/60 dark:border-white/10 rounded-[1.5rem] p-5 shadow-2xl w-56 animate-[float_7s_ease-in-out_infinite_1s] z-20">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AI ATS Score</span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-1">87%</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-300 font-semibold leading-normal">Outstanding resume match relevance.</p>
            </div>
          </div>
        </div>

        {/* Partner Logo Cloud */}
        <div className="pt-20 pb-10 border-b border-slate-200/50 dark:border-white/5">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by global technological leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="font-extrabold text-xl tracking-tight text-slate-500">MICROSOFT</span>
            <span className="font-extrabold text-xl tracking-tight text-slate-500">GOOGLE</span>
            <span className="font-extrabold text-xl tracking-tight text-slate-500">AMAZON</span>
            <span className="font-extrabold text-xl tracking-tight text-slate-500">META</span>
            <span className="font-extrabold text-xl tracking-tight text-slate-500">NETFLIX</span>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="py-24 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Designed for modern recruitments</h2>
            <p className="text-slate-500 font-medium">A set of next-generation features that brings companies and talent together instantly.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className={`backdrop-blur-xl p-8 rounded-[2rem] border transition-all duration-300 group hover:-translate-y-1.5 ${isDark ? 'bg-white/[0.02] border-white/10 hover:border-indigo-500/30' : 'bg-white/80 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.06)] hover:border-indigo-100'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-105 duration-300 ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm'}`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <h3 className={`text-xl font-bold mb-3 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>Unified Profile Setup</h3>
              <p className={`text-sm leading-relaxed font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Choose your industry track (IT or NON-IT), list domains, and upload resumes for secure verification.</p>
            </div>

            {/* Card 2 */}
            <div className={`backdrop-blur-xl p-8 rounded-[2rem] border transition-all duration-300 group hover:-translate-y-1.5 ${isDark ? 'bg-white/[0.02] border-white/10 hover:border-purple-500/30' : 'bg-white/80 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:border-purple-100'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-105 duration-300 ${isDark ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-purple-50 border border-purple-100 text-purple-600 shadow-sm'}`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className={`text-xl font-bold mb-3 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>Proctored Assessments</h3>
              <p className={`text-sm leading-relaxed font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enter a locked full-screen proctored assessment matched directly to your technical skills. Finish with instant results.</p>
            </div>

            {/* Card 3 */}
            <div className={`backdrop-blur-xl p-8 rounded-[2rem] border transition-all duration-300 group hover:-translate-y-1.5 ${isDark ? 'bg-white/[0.02] border-white/10 hover:border-emerald-500/30' : 'bg-white/80 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)] hover:border-emerald-100'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-105 duration-300 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm'}`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className={`text-xl font-bold mb-3 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>Direct Placement Pipeline</h3>
              <p className={`text-sm leading-relaxed font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Let recruiters view your verified credentials, test scores, and ATS grades. Shortlist and recruit seamlessly.</p>
            </div>
          </div>
        </div>

        {/* Workflow Timeline Section */}
        <div className="py-16 border-t border-slate-200/50 dark:border-white/5 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>How Job Fair Works</h2>
            <p className="text-slate-500 font-medium">A step-by-step roadmap to verified employment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="text-center space-y-4 relative group">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">1</div>
              <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Register & Setup</h4>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">Create your credentials and setup your profile. Choose either IT or NON-IT track with specific career focus.</p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center space-y-4 relative group">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">2</div>
              <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Skill Assessment</h4>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">Solve a 20-minute, proctored competency test designed specifically to check your skill proficiency.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4 relative group">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">3</div>
              <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Verified Placements</h4>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">Top tech partners view verified test scores and parsed resume grades to shortlist and invite for interviews.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-12 text-center relative z-10 transition-colors ${isDark ? 'border-white/5 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">J</div>
            <span className={`font-extrabold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>Job Fair</span>
          </div>
          <p className="text-sm font-bold tracking-wide">© 2026 Job Fair. Designed with excellence.</p>
          <div className="flex gap-4 text-xs font-bold">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Use</a>
          </div>
        </div>
      </footer>

      {/* Float animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
