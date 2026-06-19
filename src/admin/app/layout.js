'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'super_admin') {
        // Redirect to respective portal if role is not super_admin
        if (user.role === 'student') {
          router.push('/student');
        } else if (user.role === 'hr_company') {
          router.push('/company');
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Verifying admin authorization...</p>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return null; // Don't render layout if not authorized
  }

  const links = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Student Approvals', path: '/admin/approvals/students' },
    { name: 'Company Approvals', path: '/admin/approvals/companies' },
    { name: 'Assessments', path: '/admin/assessments' },
    { name: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Admin Sidebar - Separate Look */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col fixed h-full shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h2 className="text-lg font-bold tracking-wider">SUPER ADMIN</h2>
          </div>
          <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {links.map(link => {
            const isActive = link.path === '/admin' ? pathname === '/admin' : pathname.startsWith(link.path);
            return (
              <Link 
                key={link.name} 
                href={link.path}
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
        <div className="p-6 border-t border-white/10 bg-black/20">
          <button onClick={logout} className="w-full bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-all">
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Admin Main Content */}
      <main className="flex-1 ml-72 min-h-screen flex flex-col">
        {/* Admin Header */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
          <h1 className="font-semibold text-slate-700">Admin Control Center</h1>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
              SA
            </div>
          </div>
        </header>
        {/* Content */}
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
