'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CompanyLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'hr_company') {
        // Redirect to respective portal if role is not hr_company
        if (user.role === 'student') {
          router.push('/student');
        } else if (user.role === 'super_admin') {
          router.push('/admin');
        }
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && user.role === 'hr_company') {
      fetch(`/api/company/profile?t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.registered && data.company) {
            setApprovalStatus(data.company.approvalStatus);
          } else {
            setApprovalStatus('unregistered');
          }
          setProfileLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch profile in layout:', err);
          setProfileLoading(false);
        });
    }
  }, [user, loading, pathname]);

  // Removed full layout override so /company renders inside the dashboard layout

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Verifying authorization...</p>
      </div>
    );
  }

  if (!user || user.role !== 'hr_company') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Redirecting...</p>
        <div className="hidden">{children}</div>
      </div>
    );
  }

  const links = [
    { name: 'Dashboard', path: '/company', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> },
    { name: 'Company Setup', path: '/company/setup', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> },
    { name: 'Job Management', path: '/company/jobs', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> },
    { name: 'Candidate Tracker', path: '/company/applicants', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-[linear-gradient(180deg,#0F172A_0%,#1E3A8A_100%)] text-white flex flex-col fixed h-full z-30 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-xl`}>
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">HR Workspace</h2>
            <p className="text-xs text-slate-300 mt-1">{user?.email}</p>
          </div>
          {/* Close button for mobile sidebar */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-slate-300 hover:text-white rounded-lg md:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-1 mt-4">
          {links.map(link => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.name} 
                href={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                  isActive ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 mt-auto">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 ml-0 min-h-screen relative flex flex-col">
        <div className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden flex items-center justify-center"
              aria-label="Open Sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h1 className="font-semibold text-slate-800 tracking-tight text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">Job Fair HR Portal</h1>
          </div>
          <div className="flex gap-2 md:gap-3 items-center">
            <Link 
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs md:text-sm rounded-lg border border-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              Home
            </Link>
            
            {approvalStatus === 'approved' && (
              <Link href="/company/jobs" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-md hover:shadow-lg transition-all ml-1 md:ml-2">
                + Post Job
              </Link>
            )}
          </div>
        </div>
        <div className="p-4 md:p-8 flex-1">
          {(() => {
            if (profileLoading) {
              return (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              );
            }

            const isRestrictedRoute = pathname.startsWith('/company/jobs') || pathname.startsWith('/company/applicants') || pathname.startsWith('/company/analytics');
            
            if (isRestrictedRoute && approvalStatus !== 'approved') {
              return (
                <div className="bg-amber-50 p-8 rounded-3xl border border-amber-200 text-amber-800 text-center max-w-2xl mx-auto mt-12 shadow-sm">
                  <svg className="w-16 h-16 mx-auto text-amber-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <h2 className="text-2xl font-black mb-3">Access Restricted</h2>
                  <p className="font-medium text-amber-700/80 text-lg mb-8">Your company profile is under review. Please wait for admin approval.</p>
                  <button onClick={() => router.push('/company')} className="px-8 py-3 bg-[#0B1E40] text-white rounded-xl font-bold hover:bg-[#152d54] transition-all shadow-md hover:-translate-y-0.5">Go to Dashboard</button>
                </div>
              );
            }

            return children;
          })()}
        </div>
      </main>
    </div>
  );
}
