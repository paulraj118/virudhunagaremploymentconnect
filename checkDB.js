import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const SelfAssessmentQuestionSchema = new mongoose.Schema(
    {
      domain: { type: String, required: true },
      level: { type: String, required: true },
    }
  );
  
  const SelfAssessmentQuestion = mongoose.models.SelfAssessmentQuestion ||
    mongoose.model('SelfAssessmentQuestion', SelfAssessmentQuestionSchema);

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
