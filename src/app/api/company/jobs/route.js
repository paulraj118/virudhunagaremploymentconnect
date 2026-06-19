import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Job from '@/models/Job';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const company = await Company.findOne({ userId: decoded.id });
    if (!company || company.approvalStatus !== 'approved') {
      return NextResponse.json({ success: false, message: 'Company is not approved to post jobs' }, { status: 403 });
    }

    const body = await request.json();
    const { title, department, role, experience, salary, skills, vacancyCount, deadline, location, description } = body;

    const job = await Job.create({
      companyId: company._id,
      title,
      department,
      role,
      experience,
      salary,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      vacancyCount,
      deadline,
      location,
      description,
    });

    return NextResponse.json({
      success: true,
      message: 'Job posted successfully',
      job
    }, { status: 201 });

  } catch (error) {
    console.error('Job Creation Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const company = await Company.findOne({ userId: decoded.id });
    if (!company) {
      return NextResponse.json({ success: false, message: 'Company profile not found' }, { status: 404 });
    }

    const jobs = await Job.find({ companyId: company._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      jobs
    });

  } catch (error) {
    console.error('Fetch Jobs Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
