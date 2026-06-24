import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { type: String, select: false },
  role: { type: String, default: 'student' },
  mobile: String,
  isEmailVerified: { type: Boolean, default: false },
  isMobileVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

rl.question('Please paste your exact MONGODB_URI (the same one you put in Vercel): ', async (MONGODB_URI) => {
  if (!MONGODB_URI) {
    console.error("You must provide the MONGODB_URI.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI.trim());
    console.log("Connected successfully!");

    const adminEmail = 'admin@jobfair.com';
    const adminPassword = 'Admin@123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log("Admin user already exists in this database!");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      mobile: '9999999999',
      role: 'super_admin',
      isEmailVerified: true,
      isMobileVerified: true,
      isActive: true
    });

    console.log("==========================================");
    console.log("✅ Admin user created successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("==========================================");
    console.log("You can now log into the Vercel admin portal.");

  } catch (error) {
    console.error("Error connecting to database:", error);
  } finally {
    mongoose.disconnect();
    rl.close();
    process.exit(0);
  }
});
