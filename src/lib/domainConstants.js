export const TRACK_DOMAINS = {
  'IT / Engineering': [
    'English Literature', 'Tamil Literature', 'History', 'Economics', 'Psychology',
    'Sociology', 'Journalism & Mass Communication', 'Visual Communication', 'Fine Arts',
    'Data Science', 'Artificial Intelligence & Machine Learning', 'Cyber Security',
    'Cloud Computing', 'Full Stack Development', 'Mechanical Engineering',
    'Civil Engineering', 'Electrical Engineering',
    'Electronics & Communication Engineering (ECE)', 'Automobile Engineering', 'Others'
  ],
  'Admin / Management': [
    'Human Resources (HR)', 'Marketing', 'Finance', 'Operations Management',
    'Business Analytics', 'Supply Chain Management', 'Banking', 'Accounting',
    'Entrepreneurship', 'Others'
  ],
  'Medical': [
    'Pharmacy', 'Clinical Research', 'Nursing', 'Physiotherapy',
    'Medical Laboratory Technology', 'Healthcare Management', 'Biotechnology',
    'Pharmacovigilance', 'Public Health', 'Others'
  ],
};

// Flatten to get all unique domains, excluding "Others" which is typically a fallback.
export const MASTER_DOMAINS = Array.from(
  new Set(Object.values(TRACK_DOMAINS).flat().filter(d => d !== 'Others'))
);
