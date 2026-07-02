import dbConnect from '@/lib/mongodb';
import College from '@/models/College';

export async function validateCollegeApproval(collegeId) {
  try {
    await dbConnect();
    const college = await College.findById(collegeId).select('approvalStatus');
    
    if (!college) {
      return { success: false, message: 'College not found', status: 404 };
    }

    // Treat undefined as Approved for backward compatibility
    if (college.approvalStatus === 'Pending' || college.approvalStatus === 'Rejected') {
      return { 
        success: false, 
        message: 'Your account is waiting for Admin approval or has been rejected.', 
        status: 403,
        approvalStatus: college.approvalStatus 
      };
    }

    return { success: true, college };
  } catch (error) {
    console.error('validateCollegeApproval Error:', error);
    return { success: false, message: 'Server error during approval validation', status: 500 };
  }
}
