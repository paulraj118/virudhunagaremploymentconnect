const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/jobfair_pro').then(async () => {
  const SelfAssessmentQuestion = require('./src/models/SelfAssessmentQuestion').default || require('./src/models/SelfAssessmentQuestion');
  const counts = await SelfAssessmentQuestion.aggregate([{ $group: { _id: '$domain', count: { $sum: 1 } } }]);
  console.log('--- DATABASE STATUS ---');
  let total = 0;
  counts.forEach(c => {
    console.log(`${c._id}: ${c.count} questions`);
    total += c.count;
  });
  console.log(`TOTAL QUESTIONS INSERTED: ${total}`);
  process.exit(0);
}).catch(console.error);
