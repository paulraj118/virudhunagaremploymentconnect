import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
import { getCurrentUser } from '@/lib/auth';

const getPerformanceStatus = (percentage) => {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 75) return 'Strong';
  if (percentage >= 50) return 'Average';
  if (percentage >= 30) return 'Weak';
  return 'Needs Improvement';
};

const getRecommendations = (topic) => {
  const t = topic.toLowerCase();
  if (t.includes('sql') || t.includes('dbms')) return ['Joins', 'Subqueries', 'Group By', 'Indexing'];
  if (t.includes('python')) return ['Functions', 'OOP', 'Exception Handling', 'List Comprehensions'];
  if (t.includes('java')) return ['Polymorphism', 'Collections Framework', 'Multithreading', 'JVM Architecture'];
  if (t.includes('communication') || t.includes('english')) return ['HR Interview Questions', 'Group Discussion', 'Spoken English', 'Body Language'];
  if (t.includes('data structure') || t.includes('algorithm')) return ['Arrays & Strings', 'Trees & Graphs', 'Dynamic Programming', 'Time Complexity'];
  if (t.includes('react') || t.includes('frontend')) return ['Hooks', 'State Management', 'Component Lifecycle', 'Performance Optimization'];
  return ['Review Core Fundamentals', 'Practice More MCQs', 'Read Official Documentation'];
};

export async function GET(request, { params }) {
  try {
    const { id: studentId } = await params;
    const decoded = await getCurrentUser();

    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const student = await Student.findById(studentId).populate('userId', 'name email registerNumber');
    
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    // Role-based Authorization
    if (decoded.role === 'student') {
      if (student.userId._id.toString() !== decoded.id) {
        return NextResponse.json({ success: false, message: 'Forbidden: You can only access your own report.' }, { status: 403 });
      }
    } else if (decoded.role === 'college') {
      if (student.collegeName !== decoded.collegeName) {
        return NextResponse.json({ success: false, message: 'Forbidden: Student does not belong to your college.' }, { status: 403 });
      }
    } else if (decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Forbidden: Unauthorized role.' }, { status: 403 });
    }

    // Fetch the latest completed assessment for the report
    const assessments = await SelfAssessmentResult.find({ studentId: student._id, status: 'completed' })
      .sort({ createdAt: -1 });

    if (assessments.length === 0) {
      return NextResponse.json({ success: false, message: 'No completed assessments found.' }, { status: 404 });
    }

    // Aggregate over all completed assessments or just the latest?
    // "The system should analyze every completed assessment..."
    // Let's aggregate ALL questions across all assessments for a holistic view.
    
    let totalQuestions = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let totalScore = 0;
    let maxScore = 0;

    const topicMap = {};

    assessments.forEach(assessment => {
      assessment.questions.forEach(q => {
        totalQuestions++;
        const topic = q.topic || 'General';
        
        if (!topicMap[topic]) {
          topicMap[topic] = { total: 0, correct: 0, wrong: 0 };
        }
        
        topicMap[topic].total++;
        if (q.isCorrect) {
          topicMap[topic].correct++;
          correctAnswers++;
          totalScore++;
        } else {
          topicMap[topic].wrong++;
          wrongAnswers++;
        }
        maxScore++;
      });
    });

    const topicsArray = Object.keys(topicMap).map(topic => {
      const stats = topicMap[topic];
      const percentage = Math.round((stats.correct / stats.total) * 100);
      return {
        topic,
        total: stats.total,
        correct: stats.correct,
        wrong: stats.wrong,
        percentage,
        performance: getPerformanceStatus(percentage),
        recommendations: getRecommendations(topic)
      };
    });

    // Sort by percentage (lowest first)
    topicsArray.sort((a, b) => a.percentage - b.percentage);

    const weakTopicsList = topicsArray.filter(t => t.percentage < 50);
    const overallPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const overallGrade = getPerformanceStatus(overallPercentage);

    const reportData = {
      student: {
        name: student.userId?.name || 'N/A',
        registerNumber: student.userId?.registerNumber || 'N/A',
        college: student.collegeName || 'N/A',
        department: student.department || 'N/A',
        year: student.yearOfPassedOut || 'N/A',
      },
      assessmentSummary: {
        assessmentName: 'Comprehensive Skill Gap Analysis',
        companyName: 'Internal Assessment',
        assessmentDate: new Date().toISOString(),
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        score: totalScore,
        percentage: overallPercentage,
        grade: overallGrade,
        strongestTopic: topicsArray.length > 0 ? topicsArray[topicsArray.length - 1].topic : 'N/A',
        weakestTopic: topicsArray.length > 0 ? topicsArray[0].topic : 'N/A',
      },
      topics: topicsArray,
      weakTopics: weakTopicsList
    };

    return NextResponse.json({ success: true, data: reportData });

  } catch (error) {
    console.error('Student Report Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
