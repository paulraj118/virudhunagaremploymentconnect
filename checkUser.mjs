import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/jobfair_pro";

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    const user = await db.collection('users').findOne({ email: 'saran@gmail.com' });
    
    if (user) {
      console.log('User found:');
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      
      // Reset password to 'password123'
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      await db.collection('users').updateOne(
        { email: 'saran@gmail.com' },
        { $set: { password: hashedPassword } }
      );
      
      console.log('Password has been reset to: password123');
    } else {
      console.log('User saran@gmail.com NOT found.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
