'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') return;

    if (!loading) {
      if (!user) {
        router.push('/admin/login');
      } else if (user.role !== 'super_admin') {
        // Redirect to respective portal if role is not super_admin
        if (user.role === 'student') {
          router.push('/student');
        } else if (user.role === 'hr_company') {
          router.push('/company');
        } else {
          router.push('/admin/login');
        }
      }
    }
  }, [user, loading, router, pathname]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logout();
    // Force redirect to admin login after the context logout
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Verifying admin authorization...</p>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Redirecting to login...</p>
        <div className="hidden">{children}</div>
      </div>
    );
  }

  const links = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Student Approvals', path: '/admin/approvals/students' },
    { name: 'Company Approvals', path: '/admin/approvals/companies' },
    { name: 'College Approvals', path: '/admin/approvals/colleges' },
    { name: 'Question Bank', path: '/admin/question-bank' },
    { name: 'SA Analytics', path: '/admin/analytics' },
    { name: 'Skill Gap Analysis', path: '/admin/skill-gap' },
    { name: 'Candidate Ranking', path: '/admin/candidate-ranking' },
    { name: 'Companies', path: '/admin/companies' },
    { name: 'Campus Recruitment', path: '/admin/drives' },
    { name: 'Interviews', path: '/admin/interviews' },
    { name: 'Offers', path: '/admin/offers' },
    { name: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar - Separate Look */}
      <aside className={`w-72 bg-linear-to-b from-slate-900 to-slate-800 text-white flex flex-col fixed h-full z-30 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-2xl`}>
        <div className="p-6 border-b border-slate-700 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h2 className="text-lg font-bold tracking-wider">SUPER ADMIN</h2>
            </div>
            {/* Close button for mobile sidebar */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg md:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1 ml-11">{user?.email}</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {links.map(link => {
            const isActive = link.path === '/admin' ? pathname === '/admin' : pathname.startsWith(link.path);
            return (
              <Link 
                key={link.name} 
                href={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-slate-700 bg-transparent mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-all border border-red-500/20 shadow-sm shadow-red-500/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            LOG OUT
          </button>
        </div>
      </aside>

      {/* Admin Main Content */}
      <main className="flex-1 md:ml-72 ml-0 min-h-screen flex flex-col">
        {/* Admin Header */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden flex items-center justify-center"
              aria-label="Open Sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h1 className="font-semibold text-slate-700 text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">Admin Center</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/" className="bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm border border-slate-200">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              Home
            </Link>
            <div className="w-px h-6 bg-slate-200 mx-0.5 md:mx-1"></div>
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs md:text-sm font-bold text-slate-600">
              SA
            </div>
          </div>
        </header>
        {/* Content */}
        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
