import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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
  
  let token;
  if (expectedRole) {
    token = cookieStore.get(`token_${expectedRole}`)?.value;
  } else {
    // Fallback: check them in order of priority if no specific role is asked for
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
