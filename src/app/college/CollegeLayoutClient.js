'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CollegeLayoutClient({ children, collegeName }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Do not show sidebar on login and register pages
  if (pathname === '/college/login' || pathname === '/college/register') {
    return <>{children}</>;
  }

  const links = [
    { name: 'Dashboard', path: '/college/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Students', path: '/college/students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Job Board', path: '/college/jobs', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { name: 'Job Offers', path: '/college/offers', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { name: 'Placement Drives', path: '/college/drives', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Profile', path: '/college/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.substring(0, 2).toUpperCase();
  };

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
      <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-30 transition-transform duration-300 md:translate-x-0 border-r border-slate-800 shadow-xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-1">College Portal</span>
            <h2 className="text-white font-bold leading-tight line-clamp-2" title={collegeName}>
              {collegeName}
            </h2>
          </div>
          {/* Close button for mobile sidebar */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg md:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className="space-y-1 px-3">
            {links.map(link => {
              const isActive = pathname.startsWith(link.path);
              return (
                <Link 
                  key={link.name} 
                  href={link.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`block px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium flex items-center gap-3 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <svg className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon}></path>
                  </svg>
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 mt-auto border-t border-slate-800 shrink-0 space-y-3 bg-slate-950">
          <div className="flex items-center justify-between p-3 border border-slate-800 rounded-2xl bg-slate-900 cursor-pointer">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 shrink-0 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                {getInitials(collegeName)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate" title={collegeName}>{collegeName}</p>
                <p className="text-xs text-slate-500 truncate">Administrator</p>
              </div>
            </div>
          </div>
          
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl text-sm font-bold transition-all border border-rose-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 ml-0 min-h-screen relative flex flex-col w-full overflow-x-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h1 className="font-bold text-slate-800 tracking-tight truncate max-w-[200px]">{collegeName}</h1>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto bg-slate-50 w-full relative">
          {children}
        </div>
      </main>
      
      {/* Scrollbar styling for sidebar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
