/**
 * Employment Connect - Question Bank API Service
 * 
 * This service is strictly for SERVER-SIDE use only to protect the API Key.
 * It provides a reusable, secure, and robust interface to communicate with the Question Bank API.
 */

// Ensure this module is never executed on the client side
if (typeof window !== 'undefined') {
  throw new Error('CRITICAL SECURITY ALERT: questionApi.js must only be used on the server-side to protect the QUESTION_API_KEY.');
}

const QUESTION_API_URL = process.env.QUESTION_API_URL || 'http://localhost:3000/api/questions';
const QUESTION_API_KEY = process.env.QUESTION_API_KEY;

/**
 * Standardized Error Class for API Service
 */
export class QuestionApiError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'QuestionApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Helper to handle fetch with timeout
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new QuestionApiError('Question Bank API Request timed out', 408, 'TIMEOUT');
    }
    throw new QuestionApiError(`Network Error: ${error.message}`, 503, 'NETWORK_ERROR');
  }
}

/**
 * Core function to fetch questions from the Question Bank
 * 
 * @param {Object} params - Query parameters for the Question Bank API
 * @returns {Promise<Object>} - The JSON response containing questions
 */
export async function fetchQuestions(params = {}) {
  if (!QUESTION_API_KEY) {
    console.error('CRITICAL: QUESTION_API_KEY environment variable is missing.');
    throw new QuestionApiError('Server misconfiguration: API Key missing', 500, 'CONFIG_ERROR');
  }

  // Construct URL with query parameters
  const url = new URL(QUESTION_API_URL);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, String(params[key]));
    }
  });

  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': QUESTION_API_KEY
    },
    // Next.js specific caching options can be added here if needed
    cache: 'no-store' // default to fresh data, especially for random tests
  };

  try {
    const response = await fetchWithTimeout(url.toString(), requestOptions, 8000); // 8 second timeout

    // Parse the JSON response body
    const data = await response.json().catch(() => null);

    // Handle standard HTTP Status Codes
    if (response.ok && data?.success) {
      return data;
    }

    if (response.status === 401) {
      throw new QuestionApiError('Unauthorized: Invalid API Key for Question Bank', 401, 'UNAUTHORIZED');
    }

    if (response.status === 429) {
      throw new QuestionApiError('Rate limit exceeded: Too many requests to the Question Bank', 429, 'RATE_LIMITED');
    }

    if (response.status >= 500) {
      throw new QuestionApiError('Internal Server Error at the Question Bank', response.status, 'SERVER_ERROR');
    }

    // Generic fallback for other non-ok errors
    throw new QuestionApiError(data?.message || `Question Bank API Error (${response.status})`, response.status, 'API_ERROR');

  } catch (error) {
    // If it's already our custom error, rethrow it
    if (error instanceof QuestionApiError) {
      throw error;
    }
    
    // Otherwise, wrap unexpected errors securely without leaking internals
    console.error('Unexpected error fetching from Question Bank:', error);
    throw new QuestionApiError('An unexpected error occurred while contacting the Question Bank.', 500, 'UNEXPECTED_ERROR');
  }
}
