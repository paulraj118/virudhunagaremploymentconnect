import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import { withApiSecurity } from '@/middleware/apiSecurity';

/**
 * Handles GET requests to fetch questions from the Question Bank.
 * Features: Pagination, Filtering, Search, Random Selection, and Sorting.
 */
async function getQuestionsHandler(request) {
  // Ensure database connection
  await dbConnect();

  const { searchParams } = new URL(request.url);

  // --- Parameter Extraction & Sanitization ---
  let parsedPage = parseInt(searchParams.get('page') || '1', 10);
  if (isNaN(parsedPage)) parsedPage = 1;
  const page = Math.max(1, parsedPage);

  let parsedLimit = parseInt(searchParams.get('limit') || '20', 10);
  if (isNaN(parsedLimit)) parsedLimit = 20;
  const limit = Math.min(100, Math.max(1, parsedLimit)); // Cap at 100 for performance
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const topic = searchParams.get('topic');
  const technology = searchParams.get('technology');
  const company = searchParams.get('company');
  const difficulty = searchParams.get('difficulty');
  const isRandom = searchParams.get('random') === 'true';
  const sortParam = searchParams.get('sort') || '-createdAt';

  // --- Build Query Object ---
  const query = {};

  if (category) {
    query.$or = [{ category: category }, { domain: category }];
  }
  if (topic) query.topic = topic;
  if (technology) query.technology = technology;
  if (company) query.company = company;
  if (difficulty) query.difficulty = difficulty;

  // Simple text search using regex (case-insensitive)
  if (search) {
    query.questionText = { $regex: search, $options: 'i' };
  }

  // Define fields to return (exclude internal versioning/deleted flags if they ever exist)
  const projection = {
    __v: 0,
    // Add any sensitive fields to exclude here in the future
  };

  let questions = [];
  let total = 0;

  // --- Random Selection vs Standard Pagination ---
  if (isRandom) {
    // Use MongoDB Aggregation for random sampling
    const pipeline = [
      { $match: query },
      { $sample: { size: limit } },
      { $project: projection }
    ];
    questions = await Question.aggregate(pipeline);
    total = questions.length; // For random, total is just the count returned
  } else {
    // --- Parse Sorting ---
    const sortObj = {};
    if (sortParam.startsWith('-')) {
      sortObj[sortParam.substring(1)] = -1;
    } else {
      sortObj[sortParam] = 1;
    }

    // Standard pagination and sorting
    total = await Question.countDocuments(query);
    questions = await Question.find(query, projection)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Use lean() for performance (returns plain JS objects)
  }

  // --- Format and Return Response ---
  return NextResponse.json({
    success: true,
    count: questions.length,
    page: isRandom ? 1 : page,
    limit,
    total,
    questions
  });
}

// Wrap the handler with our production-grade security middleware
export const GET = withApiSecurity(getQuestionsHandler);
