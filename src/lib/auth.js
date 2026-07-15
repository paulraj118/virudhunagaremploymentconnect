import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
}

export const signToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const getCurrentUser = async (expectedRole = null) => {
  const cookieStore = await cookies();
  const headersList = await headers();
  const referer = headersList.get('referer') || '';
  
  let token;
  if (expectedRole) {
    token = cookieStore.get(`token_${expectedRole}`)?.value;
  } else if (referer.includes('/admin')) {
    token = cookieStore.get('token_super_admin')?.value;
  } else if (referer.includes('/student')) {
    token = cookieStore.get('token_student')?.value;
  } else if (referer.includes('/company')) {
    token = cookieStore.get('token_hr_company')?.value || cookieStore.get('token_company')?.value;
  } else if (referer.includes('/college')) {
    token = cookieStore.get('token_college')?.value;
  } else {
    // Fallback: check them in order of priority if no specific role is asked for and no referer context
    token = cookieStore.get('token_super_admin')?.value || 
            cookieStore.get('token_student')?.value || 
            cookieStore.get('token_hr_company')?.value || 
            cookieStore.get('token_company')?.value || 
            cookieStore.get('token_college')?.value || 
            cookieStore.get('token')?.value;
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  return decoded; // Returns { id, role, iat, exp }
};
