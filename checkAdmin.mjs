import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/job-fair"; // Usually default localhost for dev

const checkAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    // Create a temporary schema just to query/update the users collection
    const UserSchema = new mongoose.Schema({
        email: String,
        role: String,
        password: { type: String, select: true }
    }, { strict: false });
    
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    let admin = await User.findOne({ role: 'super_admin' });
    if (admin) {
      console.log('Admin already exists:');
      console.log('Email:', admin.email);
      // Can't decrypt password, so let's update it to 'admin123'
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash('admin123', salt);
      await admin.save();
      console.log('Password reset to: admin123');
    } else {
      console.log('No admin found. Creating one...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      admin = await User.create({
        name: 'Super Admin',
        email: 'admin@jobfair.com',
        password: hashedPassword,
        mobile: '1234567890',
        role: 'super_admin',
        isActive: true,
        isEmailVerified: true,
        isMobileVerified: true
      });
      console.log('Admin created:');
      console.log('Email: admin@jobfair.com');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

checkAdmin();
