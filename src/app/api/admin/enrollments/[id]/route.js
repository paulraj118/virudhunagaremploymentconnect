import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import AssessmentResult from '@/models/AssessmentResult';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    
    const student = await Student.findById(id).populate('userId', '-password').lean();
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const assessments = await AssessmentResult.find({ studentId: id }).lean();

    return NextResponse.json({
      success: true,
      data: {
        ...student,
        assessments
      }
    });

  } catch (error) {
    console.error('Fetch Student Error:', error);
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
    const { status, collegeName } = body;

    const updateData = {};
    if (status) {
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
      }
      updateData.enrollmentStatus = status;
    }
    if (collegeName) updateData.collegeName = collegeName;

    await dbConnect();
    
    const student = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student enrollment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Enrollment successfully updated`,
      data: student
    });

  } catch (error) {
    console.error('Update Enrollment Error:', error);
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
    
    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student enrollment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student enrollment successfully deleted'
    });

  } catch (error) {
    console.error('Delete Enrollment Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
