import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// Allow larger request body for certificate file uploads (base64)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Check if already registered
    const existingCompany = await Company.findOne({ userId: decoded.id });
    if (existingCompany) {
      return NextResponse.json({ success: false, message: 'Company already registered' }, { status: 400 });
    }

    const body = await request.json();
    const { companyName, hrName, website, address, linkedIn, description, industryType, companySize, dpiitRegistered } = body;

    const company = await Company.create({
      userId: decoded.id,
      companyName,
      hrName,
      website,
      address,
      linkedIn,
      description,
      industryType,
      companySize,
      dpiitRegistered,
      approvalStatus: 'pending' // As per workflow
    });

    return NextResponse.json({
      success: true,
      message: 'Company registration submitted successfully. Pending Admin Approval.',
      company
    }, { status: 201 });

  } catch (error) {
    console.error('Company Registration Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ success: false, message: `Validation failed: ${messages.join(', ')}` }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'A company profile already exists or duplicate code/email detected.' }, { status: 400 });
    }
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
    const company = await Company.findOne({ userId: decoded.id }).populate('userId', 'name email mobile');
    
    if (!company) {
      return NextResponse.json({ success: true, registered: false });
    }

    return NextResponse.json({
      success: true,
      registered: true,
      company
    });

  } catch (error) {
    console.error('Fetch Company Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const company = await Company.findOne({ userId: decoded.id });
    if (!company) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      companyName, 
      hrName, 
      website, 
      address, 
      linkedIn, 
      description, 
      industryType, 
      companySize, 
      logoUrl, 
      supportEmail, 
      supportPhone,
      esiCertificateUrl,
      itCertificateUrl,
      incCertificateUrl,
      dpiitNumber
    } = body;

    // Update fields if provided
    if (companyName) company.companyName = companyName;
    if (hrName) company.hrName = hrName;
    if (website !== undefined) company.website = website;
    if (address) company.address = address;
    if (linkedIn) company.linkedIn = linkedIn;
    if (description !== undefined) company.description = description;
    if (industryType) company.industryType = industryType;
    if (companySize) company.companySize = companySize;
    if (logoUrl !== undefined) company.logoUrl = logoUrl;
    if (supportEmail !== undefined) company.supportEmail = supportEmail;
    if (supportPhone !== undefined) company.supportPhone = supportPhone;
    if (esiCertificateUrl !== undefined) company.esiCertificateUrl = esiCertificateUrl;
    if (itCertificateUrl !== undefined) company.itCertificateUrl = itCertificateUrl;
    if (incCertificateUrl !== undefined) company.incCertificateUrl = incCertificateUrl;
    if (dpiitNumber !== undefined) company.dpiitNumber = dpiitNumber;

    await company.save();

    return NextResponse.json({
      success: true,
      message: 'Company profile updated successfully',
      company
    });

  } catch (error) {
    console.error('Update Company Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ success: false, message: `Validation failed: ${messages.join(', ')}` }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

