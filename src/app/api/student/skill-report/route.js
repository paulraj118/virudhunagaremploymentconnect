import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

function getReadinessLevel(score) {
  if (score >= 85) return 'Job Ready';
  if (score >= 70) return 'Advanced';
  if (score >= 50) return 'Intermediate';
  return 'Beginner';
}

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get Student Profile
    const student = await Student.findOne({ userId: decoded.id });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    // Get all completed assessments
    const results = await SelfAssessmentResult.find({
      studentId: student._id,
      status: 'completed'
    }).sort({ completionDate: -1, createdAt: -1 });

    if (!results || results.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No completed assessments found. Please take an assessment first.'
      });
    }

    const preferredDomain = student.preferredDomain || results[0].preferredDomain;

    // Aggregate all questions across all completed assessments
    const allQuestions = [];
    results.forEach(r => {
      if (r.questions && Array.isArray(r.questions)) {
        allQuestions.push(...r.questions);
      }
    });

    const totalQuestionsCount = allQuestions.length;
    const correctCount = allQuestions.filter(q => q.isCorrect).length;
    const overallPercentage = totalQuestionsCount > 0 ? Math.round((correctCount / totalQuestionsCount) * 100) : 0;

    // 1. Analyze Topics (Strength & Weakness)
    const topicStats = {};
    const difficultyStats = {
      Easy: { total: 0, correct: 0 },
      Medium: { total: 0, correct: 0 },
      Hard: { total: 0, correct: 0 },
    };

    allQuestions.forEach(q => {
      // Difficulty stats
      if (difficultyStats[q.difficulty]) {
        difficultyStats[q.difficulty].total++;
        if (q.isCorrect) difficultyStats[q.difficulty].correct++;
      }

      // Topic stats
      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { correct: 0, total: 0, incorrect: 0, skipped: 0 };
      }
      topicStats[q.topic].total++;
      if (q.isCorrect) {
        topicStats[q.topic].correct++;
      } else {
        topicStats[q.topic].incorrect++;
        if (q.selectedOptionIndex === -1) {
          topicStats[q.topic].skipped++;
        }
      }
    });

    // 2. Identify Weak & Strong Topics
    const topicsArray = Object.keys(topicStats).map(topic => ({
      name: topic,
      ...topicStats[topic],
      accuracy: topicStats[topic].total > 0 ? (topicStats[topic].correct / topicStats[topic].total) * 100 : 0
    }));

    // Weak topics (accuracy < 60% or strictly sorting by lowest accuracy)
    const weakTopics = [...topicsArray].filter(t => t.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy);
    // Strong topics (accuracy >= 70%)
    const strongTopics = [...topicsArray].filter(t => t.accuracy >= 70).sort((a, b) => b.accuracy - a.accuracy);

    const readinessLevel = getReadinessLevel(overallPercentage);

    // 3. Generate Roadmap
    // We need 4 topics to focus on. Take from weak topics first.
    let roadmapTopics = weakTopics.map(t => t.name);
    
    // If fewer than 4 weak topics, pad with any other topics they encountered to just revise them
    if (roadmapTopics.length < 4) {
      const padding = topicsArray.filter(t => !roadmapTopics.includes(t.name)).map(t => t.name);
      roadmapTopics = [...roadmapTopics, ...padding];
    }
    
    // Default fallback if database questions didn't have distinct topics
    while(roadmapTopics.length < 4) {
      roadmapTopics.push('General Concepts');
    }

    const roadmap = [
      { week: 1, title: 'Foundational Review', tasks: [roadmapTopics[0], roadmapTopics[1]] },
      { week: 2, title: 'Advanced Concepts', tasks: [roadmapTopics[2], roadmapTopics[3]] },
      { week: 3, title: 'Practice Assessment', tasks: ['Take a practice quiz on weak topics'] },
      { week: 4, title: 'Final Mock Test', tasks: ['Complete a full-length mock assessment'] }
    ];

    // 4. Recommendations
    const recommendations = [];
    if (weakTopics.length > 0) {
      recommendations.push(`Focus on improving your knowledge in: ${weakTopics.slice(0, 2).map(t => t.name).join(', ')}.`);
    } else {
      recommendations.push(`Great job! Keep practicing advanced questions in ${preferredDomain}.`);
    }

    if (overallPercentage < 50) {
      recommendations.push('Consider retaking the assessment after completing the Week 2 learning roadmap.');
    } else if (overallPercentage >= 85) {
      recommendations.push('You are Job Ready! Consider applying for jobs in the Job Board.');
    }

    return NextResponse.json({
      success: true,
      data: {
        score: overallPercentage,
        readinessLevel,
        domain: preferredDomain,
        strongTopics: strongTopics.map(t => t.name).slice(0, 5),
        weakTopics: weakTopics.map(t => t.name).slice(0, 5),
        difficultyPerformance: {
          Easy: difficultyStats.Easy.total > 0 ? Math.round((difficultyStats.Easy.correct / difficultyStats.Easy.total) * 100) : 0,
          Medium: difficultyStats.Medium.total > 0 ? Math.round((difficultyStats.Medium.correct / difficultyStats.Medium.total) * 100) : 0,
          Hard: difficultyStats.Hard.total > 0 ? Math.round((difficultyStats.Hard.correct / difficultyStats.Hard.total) * 100) : 0,
        },
        roadmap,
        recommendations
      }
    });

  } catch (error) {
    console.error('Skill Report Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
