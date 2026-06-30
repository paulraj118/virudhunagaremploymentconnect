import { getCurrentUser } from './auth';
import dbConnect from './mongodb';
import Company from '@/models/Company';
import Interview from '@/models/Interview';

/**
 * Validates HR role and checks company ownership for the given interview.
 * Returns { success: true, interview, company, decoded } or a JSON error response payload.
 */
export async function validateHRInterviewAccess(interviewId, allowedRoles = ['hr_company', 'company']) {
  await dbConnect();

  const decoded = await getCurrentUser();
  if (!decoded) {
    return {
      success: false,
      status: 401,
      payload: {
        success: false,
        message: 'Unauthorized: No token provided',
        errors: ['Authentication required']
      }
    };
  }

  if (!allowedRoles.includes(decoded.role)) {
    return {
      success: false,
      status: 403,
      payload: {
        success: false,
        message: 'Forbidden: Insufficient permissions',
        errors: [`Role ${decoded.role} not authorized`]
      }
    };
  }

  let interview = null;
  try {
    interview = await Interview.findById(interviewId);
  } catch (err) {
    if (err.name === 'CastError') {
      return {
        success: false,
        status: 400,
        payload: {
          success: false,
          message: 'Invalid Interview ID format',
          errors: [`The ID '${interviewId}' is not a valid ObjectId`]
        }
      };
    }
    throw err;
  }

  if (!interview) {
    return {
      success: false,
      status: 404,
      payload: {
        success: false,
        message: 'Interview not found',
        errors: [`No interview with ID ${interviewId}`]
      }
    };
  }

  let company = null;
  let companyIdString = '';

  if (decoded.role === 'hr_company') {
    company = await Company.findOne({ userId: decoded.id });
    if (!company) {
      return {
        success: false,
        status: 404,
        payload: {
          success: false,
          message: 'Company profile not found',
          errors: ['No company profile linked to this user']
        }
      };
    }
    companyIdString = company._id.toString();
  } else if (decoded.role === 'company') {
    // Legacy flow: decoded.id is the company ID itself
    companyIdString = decoded.id;
  }

  if (interview.companyId.toString() !== companyIdString) {
    return {
      success: false,
      status: 403,
      payload: {
        success: false,
        message: 'Forbidden: Access denied',
        errors: ['Interview does not belong to your company']
      }
    };
  }

  return {
    success: true,
    interview,
    company,
    decoded
  };
}
