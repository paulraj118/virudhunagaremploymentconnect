'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function StudentLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'student') {
        // Redirect to respective portal if role is not student
        if (user.role === 'hr_company') {
          router.push('/company');
        } else if (user.role === 'super_admin') {
          router.push('/admin');
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Verifying authorization...</p>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Redirecting...</p>
        <div className="hidden">{children}</div>
      </div>
    );
  }

  const links = [
    { name: 'Dashboard', path: '/student' },
    { name: 'Profile & Resume', path: '/student/profile' },
    { name: 'Assessments', path: '/student/assessments' },
    { name: 'My Applications', path: '/student/applications' },
    { name: 'Job Board', path: '/student/jobs' },
    { name: 'Certificates', path: '/student/certificates' },
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
      <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed h-full z-30 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-indigo-400">Candidate Portal</h2>
            <p className="text-xs text-slate-400 mt-1">{user?.name}</p>
          </div>
          {/* Close button for mobile sidebar */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg md:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {links.map(link => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.name} 
                href={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-slate-800 mt-auto">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-all border border-red-500/20 shadow-sm shadow-red-500/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            LOG OUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 ml-0 min-h-screen relative">
        <div className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden flex items-center justify-center"
              aria-label="Open Sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h1 className="font-bold text-slate-800 tracking-tight text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">Job Fair Workspace</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs md:text-sm rounded-lg border border-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              Home
            </Link>
          </div>
        </div>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
