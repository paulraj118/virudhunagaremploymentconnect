import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import College from '@/models/College';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const expectedRole = request.headers.get('x-expected-role');
    const decoded = await getCurrentUser(expectedRole || null);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Handle College users (they are stored in College collection, not User collection)
    if (decoded.role === 'college') {
      const college = await College.findById(decoded.id);
      
      if (!college) {
        const response = NextResponse.json({ success: false, message: 'College not found' }, { status: 404 });
        response.cookies.delete('token');
        return response;
      }

      return NextResponse.json({
        success: true,
        user: {
          id: college._id,
          name: college.collegeName,
          email: college.email,
          role: 'college',
          // Colleges use separate verification system (approvalStatus)
          isEmailVerified: true,
          isMobileVerified: true,
        }
      });
    }

    // Handle standard Users (students, HR, super_admin)
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      const response = NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      response.cookies.delete('token');
      return response;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified,
      }
    });

  } catch (error) {
    console.error('Auth Me Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
