import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import Job from '@/models/Job';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const company = await Company.findById(id).populate('userId', 'name email mobile');
    if (!company) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    // Fetch jobs posted by this company
    const jobs = await Job.find({ companyId: company._id }).select('title department location salary vacancyCount isActive createdAt');

    const companyData = company.toObject();
    companyData.jobs = jobs;

    return NextResponse.json({ success: true, data: companyData });
  } catch (error) {
    console.error('Get Company Details Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const { status } = await request.json();

    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

    const company = await Company.findByIdAndUpdate(
      id, 
      { 
        status: capitalizedStatus,
        approvalStatus: status
      }, 
      { new: true }
    ).select('-password');
    
    if (!company) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, company, message: 'Company status updated' });
  } catch (error) {
    console.error('Update Company Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
