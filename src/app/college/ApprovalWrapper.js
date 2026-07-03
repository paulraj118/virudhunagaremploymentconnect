import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import College from '@/models/College';
import LogoutButton from './LogoutButton';
import RefreshButton from './RefreshButton';

const ClockIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

const AlertIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);

export default async function ApprovalWrapper({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return children;

  const decoded = verifyToken(token);
  if (decoded?.role !== 'college') return children;

  await dbConnect();
  const college = await College.findById(decoded.id).select('approvalStatus');
  
  if (college && (college.approvalStatus === 'Pending' || college.approvalStatus === 'Rejected')) {
    const isPending = college.approvalStatus === 'Pending';
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-md w-full text-center">
          <div className="text-4xl mb-4 mx-auto text-center flex justify-center">
            {isPending ? '🏫' : '🔴'}
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            {isPending ? 'College Registration Submitted Successfully' : 'Registration Rejected'}
          </h2>
          
          <div className="text-slate-600 mb-6 leading-relaxed space-y-4">
            {isPending ? (
              <>
                <p>Your registration has been received successfully.</p>
                <p>Your account is currently under Admin Review.</p>
                <p>Please wait until the Super Admin approves your College.</p>
                <p>After approval, you will gain access to all College Portal features.</p>
                
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm font-semibold text-amber-800 uppercase tracking-wider mb-1">Current Status</p>
                  <p className="text-lg font-bold text-amber-600 flex items-center justify-center gap-2">
                    🟡 Pending Approval
                  </p>
                </div>
              </>
            ) : (
              <>
                <p>Your College registration has been rejected by the Administrator.</p>
                <p>Please contact the Administrator for further assistance.</p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-8">
            {isPending && <RefreshButton />}
            <LogoutButton />
          </div>
        </div>
      </div>
    );
  }

  return children;
}
