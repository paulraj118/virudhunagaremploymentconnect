import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import Job from '@/models/Job';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    
    const company = await Company.findById(id).populate('userId', 'name email mobile role');

    if (!company) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    // Fetch jobs posted by this company
    const jobs = await Job.find({ companyId: company._id }).sort({ createdAt: -1 });

    // Transform data to include jobs
    const data = company.toObject();
    data.jobs = jobs;

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Fetch Company Details Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, companyName, hrName } = body;

    const updateData = {};
    if (status) {
      if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
        return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
      }
      updateData.approvalStatus = status;
    }
    if (companyName) updateData.companyName = companyName;
    if (hrName) updateData.hrName = hrName;

    await dbConnect();
    
    const company = await Company.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!company) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Company successfully updated`,
      data: company
    });

  } catch (error) {
    console.error('Update Company Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    
    const company = await Company.findByIdAndDelete(id);

    if (!company) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Company successfully deleted'
    });

  } catch (error) {
    console.error('Delete Company Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
