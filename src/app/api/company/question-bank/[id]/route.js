import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import QuestionBank from '@/models/QuestionBank';
import QuestionBankAuditLog from '@/models/QuestionBankAuditLog';
import dbConnect from '@/lib/mongodb';

// PUT - Update a question, change status, soft delete, or add version
export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'hr_company' && decoded.role !== 'admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const question = await QuestionBank.findById(id);
    if (!question) {
      return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
    }

    let companyId = null;
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company || (question.companyId && question.companyId.toString() !== company._id.toString())) {
        return NextResponse.json({ success: false, message: 'Unauthorized to edit this question' }, { status: 403 });
      }
      companyId = company._id;
    }

    let action = 'Edited';
    let auditDetails = {};

    if (body.isDeleted === true) {
       question.isDeleted = true;
       question.deletedAt = new Date();
       question.deletedBy = decoded.id;
       action = 'Deleted';
    } else if (body.isDeleted === false && question.isDeleted === true) {
       question.isDeleted = false;
       question.deletedAt = null;
       question.deletedBy = null;
       action = 'Restored';
    } else {
       // Regular Edit or Status change
       if (body.status && body.status !== question.status) {
         if (body.status === 'Approved') action = 'Approved';
         else if (body.status === 'Archived') action = 'Archived';
         auditDetails = { oldStatus: question.status, newStatus: body.status };
         question.status = body.status;
       }

       if (body.content) {
         // Log version history
         const oldContent = JSON.parse(JSON.stringify(question.content));
         question.versionHistory.push({
           version: question.currentVersion,
           previousContent: oldContent,
           editedBy: decoded.id,
           editedAt: new Date()
         });
         question.currentVersion += 1;
         
         question.content = body.content;
         if (body.jobRole) question.jobRole = body.jobRole;
         if (body.category) question.category = body.category;
         if (body.tags) question.tags = body.tags;
         if (body.language) question.language = body.language;
         if (body.marks) question.marks = body.marks;
       }
    }

    await question.save();

    await QuestionBankAuditLog.create({
      action: action,
      questionId: question._id,
      companyId,
      userId: decoded.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      details: auditDetails
    });

    return NextResponse.json({ success: true, message: `Question ${action.toLowerCase()} successfully`, question });

  } catch (error) {
    console.error('Update Question Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
