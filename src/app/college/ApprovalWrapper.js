import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import College from '@/models/College';
import LogoutButton from './LogoutButton';

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
          <div className={`w-20 h-20 ${isPending ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner`}>
            {isPending ? (
              <ClockIcon className="w-10 h-10" />
            ) : (
              <AlertIcon className="w-10 h-10" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            {isPending ? 'Account Pending' : 'Registration Rejected'}
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {isPending 
              ? 'Your registration has been submitted successfully. Your account is waiting for Admin approval. Please wait until the administrator approves your registration.'
              : 'Your registration has been rejected. Please contact the administrator.'}
          </p>
          <LogoutButton />
        </div>
      </div>
    );
  }

  return children;
}
