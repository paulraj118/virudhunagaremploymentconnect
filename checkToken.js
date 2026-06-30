import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Parse .env file manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  for (const line of envConfig.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

// Import models
import User from './src/models/User.js';

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const email = 'paulraj112003@gmail.com';
    const user = await User.findOne({ email });
    
    if (user) {
      console.log(`Found user: ${email}`);
      console.log(`Reset Token Hash in DB: ${user.resetPasswordToken}`);
      console.log(`Reset Expiry in DB: ${user.resetPasswordExpire}`);
      
      const providedToken = 'd49d1c714ea46662ca9c1f762b7cc6d9552003eb2f40878384d2add66e0dcf3f';
      const providedTokenHash = crypto.createHash('sha256').update(providedToken).digest('hex');
      console.log(`\nProvided Token: ${providedToken}`);
      console.log(`Computed Hash for provided token: ${providedTokenHash}`);
      
      if (user.resetPasswordToken === providedTokenHash) {
         console.log("HASHES MATCH!");
         if (user.resetPasswordExpire > new Date()) {
             console.log("TOKEN IS NOT EXPIRED.");
         } else {
             console.log("TOKEN IS EXPIRED.");
         }
      } else {
         console.log("HASHES DO NOT MATCH! A new token might have been generated.");
      }

    } else {
      console.log(`User not found: ${email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
