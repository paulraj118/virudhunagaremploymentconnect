'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const heroImages = [
  '/images/new-hero-1.jpg',
  '/images/new-hero-2.jpg',
  '/images/new-hero-3.jpg',
  '/images/new-hero-4.jpg',
  '/images/new-hero-5.jpg'
];

export default function LandingPage() {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans">
      {/* Header */}
      <header className="bg-white py-3 px-6 md:px-12 flex items-center justify-between shadow-sm sticky top-0 z-50">
        {/* Logo */}
        <div className="flex items-center">
          <img src="/logo.png" alt="Theni Employment Connect" className="h-16 w-auto" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/200x80?text=Logo" }} />
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
