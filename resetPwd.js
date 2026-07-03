const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/MONGODB_URI=(.+)/);
const uri = match[1].trim();

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const hash = await bcrypt.hash('Test@123', 10);
  await db.collection('users').updateOne(
    { email: 'paulraj112003@gmail.com' },
    { $set: { password: hash } }
  );
  console.log('Password updated to Test@123 for paulraj112003@gmail.com');
  await mongoose.disconnect();
}).catch(err => console.error(err));
