import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/jobfair_pro"; // Default localhost for dev

const checkAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB:', MONGODB_URI);

    // Create a temporary schema just to query/update the users collection
    const UserSchema = new mongoose.Schema({
        email: String,
        role: String,
        password: { type: String, select: true }
    }, { strict: false });
    
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const users = await User.find({
      $or: [
        { role: 'super_admin' },
        { email: 'admin@jobfair.com' }
      ]
    });

    console.log('Found matching users in DB:', users.length);
    for (const u of users) {
      console.log(`- ID: ${u._id}, Email: ${u.email}, Role: ${u.role}`);
    }

    // Let's find specifically the user with email 'admin@jobfair.com'
    let admin = await User.findOne({ email: 'admin@jobfair.com' });
    if (admin) {
      console.log('Found user with email admin@jobfair.com. Updating role to super_admin and password to admin123...');
      admin.role = 'super_admin';
      admin.password = hashedPassword;
      await admin.save();
      console.log('Successfully updated admin@jobfair.com!');
    } else {
      console.log('No user with email admin@jobfair.com. Creating a new super_admin user...');
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
      console.log('Admin created with Email: admin@jobfair.com, Password: admin123');
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

checkAdmin();
