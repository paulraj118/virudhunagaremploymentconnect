import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sendEmail } from './src/lib/resendMail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function runTest() {
  console.log('--- STARTING VERIFICATION ---');

  // Test 1: Validate Nodemailer Transporter Reusability & Execution
  console.log('\n1. Testing Nodemailer Execution...');
  
  const htmlEmail = `
  <!DOCTYPE html>
  <html>
  <body>
    <h2>Interview Invitation - TEST</h2>
    <p>This is a test email to verify the Employment Connect interview invitation feature.</p>
    <p>Date: ${new Date().toLocaleString()}</p>
  </body>
  </html>`;

  try {
    const result = await sendEmail({
      to: 'tnemploymentconnect@gmail.com', // Sending to the company itself for test
      subject: 'Test Interview Invitation - Verification',
      html: htmlEmail,
      priority: 'high'
    });
    
    if (result.success) {
      console.log('✅ Nodemailer executed successfully.');
      console.log(`✅ Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Nodemailer execution failed:', result.error);
    }
  } catch (err) {
    console.error('❌ Error during sendEmail execution:', err);
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
  process.exit(0);
}

runTest();
