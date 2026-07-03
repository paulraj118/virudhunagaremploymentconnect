const mongoose = require('mongoose');
const { TRACK_DOMAINS } = require('./src/lib/domainConstants'); // Need babel or just copy array

const MASTER_DOMAINS = [
  'English Literature', 'Tamil Literature', 'History', 'Economics', 'Psychology',
  'Sociology', 'Journalism & Mass Communication', 'Visual Communication', 'Fine Arts',
  'Data Science', 'Artificial Intelligence & Machine Learning', 'Cyber Security',
  'Cloud Computing', 'Full Stack Development', 'Mechanical Engineering',
  'Civil Engineering', 'Electrical Engineering',
  'Electronics & Communication Engineering (ECE)', 'Automobile Engineering',
  'Human Resources (HR)', 'Marketing', 'Finance', 'Operations Management',
  'Business Analytics', 'Supply Chain Management', 'Banking', 'Accounting',
  'Entrepreneurship', 'Pharmacy', 'Clinical Research', 'Nursing', 'Physiotherapy',
  'Medical Laboratory Technology', 'Healthcare Management', 'Biotechnology',
  'Pharmacovigilance', 'Public Health'
];

mongoose.connect('mongodb://127.0.0.1:27017/jobfair_pro').then(async () => {
  const SelfAssessmentQuestion = require('./src/models/SelfAssessmentQuestion').default || require('./src/models/SelfAssessmentQuestion');
  
  const counts = await SelfAssessmentQuestion.aggregate([
    { $group: { _id: '$domain', count: { $sum: 1 } } }
  ]);
  
  const availableDomains = counts.map(c => c._id);
  const availableWithCounts = counts.map(c => `${c._id} (${c.count} questions)`);
  
  const missingDomains = MASTER_DOMAINS.filter(d => !availableDomains.includes(d));
  
  console.log('=== DOMAINS WITH QUESTIONS ===');
  if (availableWithCounts.length > 0) {
    availableWithCounts.forEach(d => console.log(d));
  } else {
    console.log('None. The database has absolutely NO questions for any domain.');
  }
  
  console.log('\n=== MISSING DOMAINS (NO QUESTIONS) ===');
  missingDomains.forEach(d => console.log(d));
  
  process.exit(0);
}).catch(console.error);
