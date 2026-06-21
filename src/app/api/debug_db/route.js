import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    let admins = await User.find({ role: 'super_admin' }).select('+password');
    
    return Response.json({ 
      success: true, 
      count: admins.length,
      admins: admins.map(a => ({
        email: a.email,
        hashPrefix: a.password ? a.password.substring(0, 15) : null
      })),
      dbUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) : 'missing'
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
