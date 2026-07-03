import mongoose from 'mongoose';
import User from './src/models/User.js';

async function updateAdmin() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in process.env');
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    // Find existing admin by old email
    let admin = await User.findOne({ email: 'admin@virudhunagar.com' });
    
    if (!admin) {
      console.log('admin@virudhunagar.com not found. Looking for any super_admin...');
      admin = await User.findOne({ role: 'super_admin' });
    }

    if (admin) {
      console.log(`Found admin: ${admin.email}. Updating...`);
      admin.email = 'admin@theni.com';
      admin.password = 'Admin@123';
      
      await admin.save();
      console.log('Admin account updated successfully!');
      console.log('New Email: admin@theni.com');
      console.log('Password updated to Admin@123.');
    } else {
      console.log('No super_admin found at all. Creating a new one...');
      const newAdmin = new User({
        name: 'Theni Admin',
        email: 'admin@theni.com',
        password: 'Admin@123',
        role: 'super_admin',
        mobile: '9999999999',
        isActive: true,
        isEmailVerified: true,
        isMobileVerified: true
      });
      await newAdmin.save();
      console.log('New admin account created successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

updateAdmin();
