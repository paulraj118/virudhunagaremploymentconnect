import CollegeLayoutClient from './CollegeLayoutClient';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import College from '@/models/College';
import ApprovalWrapper from './ApprovalWrapper';

export default async function CollegeRootLayout({ children }) {
  // Fetch college name if logged in
  let collegeName = "College Portal";
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.role === 'college') {
        await dbConnect();
        const college = await College.findById(decoded.id).select('collegeName');
        if (college) {
          collegeName = college.collegeName;
        }
      }
    }
  } catch (error) {
    // Gracefully handle errors and fallback to default name
    console.error("Layout college fetch error:", error);
  }

  return (
    <ApprovalWrapper>
      <CollegeLayoutClient collegeName={collegeName}>
        {children}
      </CollegeLayoutClient>
    </ApprovalWrapper>
  );
}
