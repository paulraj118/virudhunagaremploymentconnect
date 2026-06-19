/**
 * Simulated AI Matching Algorithm
 * Calculates compatibility between a Student profile and a Job posting
 */

export function calculateMatchScore(studentSkills, jobSkills, studentExperience, jobExperienceReq) {
  // 1. Skill Match Calculation
  const studentSkillsArr = (studentSkills || []).map(s => s.toLowerCase().trim());
  const jobSkillsArr = (jobSkills || []).map(s => s.toLowerCase().trim());
  
  let matchedSkillsCount = 0;
  let missingSkills = [];

  jobSkillsArr.forEach(jobSkill => {
    if (studentSkillsArr.includes(jobSkill)) {
      matchedSkillsCount++;
    } else {
      missingSkills.push(jobSkill);
    }
  });

  const skillMatchPercentage = jobSkillsArr.length > 0 
    ? Math.round((matchedSkillsCount / jobSkillsArr.length) * 100) 
    : 100;

  // 2. Experience Match Calculation (Simulated logic based on string parsing)
  // For instance "0-2 Years", "3-5 Years". If student is fresher (Year of Study = 4), match is high for 0-2.
  let experienceMatchPercentage = 50; // Default baseline
  const reqExp = (jobExperienceReq || '').toLowerCase();
  
  if (reqExp.includes('fresher') || reqExp.includes('0')) {
    experienceMatchPercentage = 100;
  } else if (reqExp.includes('1') || reqExp.includes('2')) {
    experienceMatchPercentage = 75;
  } else {
    experienceMatchPercentage = 30; // Highly experienced role
  }

  // 3. Overall Resume Score
  // Weighting: 70% Skills, 30% Experience
  const resumeScore = Math.round((skillMatchPercentage * 0.7) + (experienceMatchPercentage * 0.3));

  return {
    skillMatchPercentage,
    experienceMatchPercentage,
    resumeScore,
    missingSkills // Used for AI Skill Gap Analysis
  };
}

export function generateInterviewQuestions(jobRole, jobSkills) {
  const role = (jobRole || '').toLowerCase();
  const questions = [
    "Tell me about a time you faced a significant challenge in a project and how you overcame it.",
    "Where do you see yourself in 3 years in this industry?"
  ];

  if (role.includes('frontend') || role.includes('react')) {
    questions.push("How does the Virtual DOM work in React?");
    questions.push("Explain how you handle state management in a large application.");
  } else if (role.includes('backend') || role.includes('node')) {
    questions.push("How do you design a scalable RESTful API?");
    questions.push("Explain event-driven architecture and how Node.js uses it.");
  } else if (role.includes('data') || role.includes('machine learning')) {
    questions.push("Explain the difference between supervised and unsupervised learning.");
    questions.push("How do you handle missing or corrupted data in a dataset?");
  } else {
    questions.push(`Can you explain your experience working with ${jobSkills[0] || 'core technologies'}?`);
  }

  return questions;
}
