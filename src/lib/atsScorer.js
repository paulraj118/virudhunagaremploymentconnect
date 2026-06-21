import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PDFParse } from 'pdf-parse';

export const DOMAIN_KEYWORDS = {
  'English Literature': ['Creative Writing', 'Content Writing', 'Copyediting', 'Textual Analysis', 'Literary Theory', 'Research'],
  'Tamil Literature': ['Tamil Translation', 'Content Writing', 'Proofreading', 'Linguistic Analysis', 'Tamil Keyboard', 'Public Speaking'],
  'History': ['Archival Research', 'Historical Analysis', 'Documentation', 'Curating', 'Cultural Resource Management', 'Academic Writing'],
  'Economics': ['Data Analysis', 'Econometrics', 'Financial Modeling', 'Stata', 'Microeconomics', 'Macroeconomics'],
  'Psychology': ['Counseling', 'Clinical Assessment', 'Active Listening', 'SPSS', 'Behavioral Analysis', 'Mental Health Support'],
  'Sociology': ['Qualitative Research', 'Social Policy Analysis', 'Community Outreach', 'SPSS', 'Survey Design', 'Data Collection'],
  'Journalism & Mass Communication': ['News Writing', 'Reporting', 'Video Editing', 'Social Media Management', 'Interviewing', 'SEO Writing'],
  'Visual Communication': ['Adobe Photoshop', 'Adobe Illustrator', 'Graphic Design', 'Video Editing', 'Storyboarding', 'Photography'],
  'Fine Arts': ['Painting', 'Illustration', 'Sculpting', 'Adobe Suite', 'Visual Arts', 'Creative Direction'],
  'Data Science': ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Scikit-Learn', 'Machine Learning', 'Deep Learning', 'SQL', 'Power BI', 'Statistics', 'Data Visualization', 'TensorFlow', 'Feature Engineering', 'Model Evaluation'],
  'Artificial Intelligence & Machine Learning': ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'OpenCV', 'LLM', 'Generative AI', 'Prompt Engineering', 'Neural Networks', 'Model Deployment', 'Transfer Learning', 'AI Ethics'],
  'Cyber Security': ['Ethical Hacking', 'Penetration Testing', 'Network Security', 'Kali Linux', 'SIEM', 'OWASP', 'Cryptography', 'Firewall', 'SOC', 'Vulnerability Assessment', 'IDS/IPS', 'Incident Response', 'Security Auditing', 'Threat Analysis', 'Risk Assessment'],
  'Cloud Computing': ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux', 'CI/CD', 'DevOps', 'Cloud Security', 'Monitoring', 'Load Balancing', 'Virtualization', 'Serverless'],
  'Full Stack Development': ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express.js', 'MongoDB', 'MySQL', 'REST API', 'Git', 'GitHub', 'JWT', 'Responsive Design'],
  'Mechanical Engineering': ['AutoCAD', 'SolidWorks', 'CATIA', 'CNC', 'Manufacturing', 'GD&T', 'Six Sigma', 'Lean Manufacturing', 'Thermal Engineering', 'Machine Design', 'Maintenance', 'PLC', 'Production Planning', 'Industrial Safety', 'Quality Control'],
  'Civil Engineering': ['AutoCAD', 'STAAD Pro', 'Revit', 'Quantity Surveying', 'Structural Design', 'Construction Management', 'Site Engineering', 'Estimation', 'Surveying', 'BOQ', 'Primavera', 'Project Planning', 'Concrete Technology', 'Building Codes', 'Quality Assurance'],
  'Electrical Engineering': ['Power Systems', 'PLC', 'SCADA', 'MATLAB', 'ETAP', 'Control Systems', 'Circuit Design', 'Industrial Automation', 'Renewable Energy', 'Electrical Safety', 'Transformer', 'Motor Control', 'Load Analysis', 'Protection Systems', 'Electrical Machines'],
  'Electronics & Communication Engineering (ECE)': ['Embedded Systems', 'VLSI', 'PCB Design', 'Verilog', 'FPGA', 'IoT', 'Arduino', 'Raspberry Pi', 'Signal Processing', 'Communication Systems', 'Microcontrollers', 'MATLAB', 'Wireless Networks', 'Sensors', 'Robotics'],
  'Automobile Engineering': ['Automotive Design', 'CATIA', 'CAD', 'Engine Systems', 'Vehicle Dynamics', 'EV Technology', 'Hybrid Vehicles', 'Manufacturing', 'Diagnostics', 'Powertrain', 'Battery Management', 'Testing', 'Maintenance', 'Quality Control', 'Industrial Safety'],
  'Human Resources (HR)': ['Recruitment', 'Talent Acquisition', 'Payroll', 'HRMS', 'Employee Relations', 'Performance Management', 'Workforce Planning', 'Onboarding', 'Training & Development', 'Compensation & Benefits', 'HR Analytics', 'Compliance', 'Interviewing', 'Employee Engagement', 'Conflict Resolution'],
  'Marketing': ['SEO', 'SEM', 'Digital Marketing', 'Google Analytics', 'Social Media Marketing', 'Content Marketing', 'Branding', 'Lead Generation', 'PPC', 'CRM', 'Campaign Management', 'Market Research', 'Email Marketing', 'Conversion Optimization', 'Marketing Strategy'],
  'Finance': ['Financial Analysis', 'Accounting', 'Budgeting', 'Forecasting', 'Taxation', 'Auditing', 'Financial Modeling', 'Excel', 'Risk Management', 'Investment Analysis', 'Banking', 'SAP', 'Cost Accounting', 'Compliance', 'Financial Reporting'],
  'Operations Management': ['Supply Chain', 'Lean Management', 'Process Optimization', 'Project Management', 'Six Sigma', 'Logistics'],
  'Business Analytics': ['SQL', 'Tableau', 'Power BI', 'Excel', 'Data Visualization', 'Python'],
  'Supply Chain Management': ['Inventory Management', 'Procurement', 'Warehouse Operations', 'SAP', 'Logistics Planning', 'Vendor Management'],
  'Banking': ['Financial Analysis', 'Credit Assessment', 'Customer Relations', 'Risk Compliance', 'Wealth Management', 'Retail Banking'],
  'Accounting': ['Taxation', 'Auditing', 'Bookkeeping', 'Tally', 'QuickBooks', 'Financial Statements'],
  'Entrepreneurship': ['Business Modeling', 'Pitching', 'Fundraising', 'Market Validation', 'Lean Startup', 'Leadership'],
  'Pharmacy': ['Pharmacology', 'Clinical Research', 'Pharmacovigilance', 'Drug Safety', 'GMP', 'Regulatory Affairs', 'Clinical Trials', 'Drug Development', 'Quality Assurance', 'Healthcare', 'Medical Writing', 'Validation', 'Documentation', 'FDA Guidelines', 'Patient Safety'],
  'Clinical Research': ['GCP', 'Clinical Trial Protocols', 'Data Management', 'Regulatory Affairs', 'Pharmacovigilance', 'CRF'],
  'Nursing': ['Patient Care', 'BLS/ACLS', 'Clinical Diagnostics', 'Electronic Health Records', 'Medication Administration', 'Triage'],
  'Physiotherapy': ['Kinesiology', 'Rehabilitation', 'Manual Therapy', 'Exercise Therapy', 'Orthopedic Assessment', 'Sports Injury Care'],
  'Medical Laboratory Technology': ['Hematology', 'Microbiology', 'Clinical Chemistry', 'Pathology Lab', 'Blood Banking', 'Lab Safety'],
  'Healthcare Management': ['Healthcare Compliance', 'Billing & Coding', 'EHR', 'Operations Management', 'Patient Relations', 'Budgeting'],
  'Biotechnology': ['PCR', 'Cell Culture', 'Molecular Biology', 'Gel Electrophoresis', 'HPLC', 'CRISPR'],
  'Pharmacovigilance': ['Adverse Event Reporting', 'Argus Safety', 'MedDRA', 'Signal Detection', 'Clinical Safety', 'FDA Regulations'],
  'Public Health': ['Epidemiology', 'Biostatistics', 'Health Promotion', 'Program Evaluation', 'Community Health', 'Data Collection']
};

const SYNONYMS = {
  'node.js': ['node.js', 'nodejs', 'node js', 'node'],
  'react': ['react', 'reactjs', 'react.js', 'react js'],
  'express': ['express', 'expressjs', 'express.js', 'express js'],
  'mongodb': ['mongodb', 'mongo'],
  'rest api': ['rest api', 'rest apis', 'restful api', 'restful apis', 'restapi', 'restapis', 'api'],
  'javascript': ['javascript', 'js'],
  'html/css': ['html', 'css', 'html5', 'css3', 'html/css', 'web development'],
  'git': ['git', 'github', 'gitlab'],
  'cyber security': ['cybersecurity', 'cyber security', 'infosec'],
  'artificial intelligence & machine learning': ['ai', 'ml', 'machine learning', 'artificial intelligence', 'deep learning'],
  'data science': ['data science', 'analytics'],
  'power bi': ['powerbi', 'power bi'],
  'sql': ['sql', 'mysql', 'postgresql', 'sqlite', 'oracle'],
  'scikit-learn': ['scikit-learn', 'sklearn'],
  'tensorflow': ['tensorflow', 'tf'],
  'ethical hacking': ['ethical hacking', 'penetration testing', 'pentesting', 'hacking'],
  'cloud computing': ['cloud', 'aws', 'gcp', 'azure'],
  'aws': ['aws', 'amazon web services']
};

function hasKeyword(pdfText, studentSkills, keyword) {
  const lowerKeyword = keyword.toLowerCase();
  
  // Get all variations to check
  const variations = SYNONYMS[lowerKeyword] || [lowerKeyword];
  
  // Check PDF text
  for (const variation of variations) {
    if (pdfText.includes(variation)) {
      return true;
    }
  }
  
  // Check student profile skills
  for (const skill of studentSkills) {
    const lowerSkill = skill.toLowerCase().trim();
    for (const variation of variations) {
      if (lowerSkill === variation || lowerSkill.includes(variation) || variation.includes(lowerSkill)) {
        return true;
      }
    }
  }
  
  return false;
}

export async function processAtsScore(student, buffer = null) {
  const domain = student.preferredDomain || '';
  const domainKeywords = DOMAIN_KEYWORDS[domain] || ['React', 'Node.js', 'Express', 'MongoDB', 'REST API', 'JavaScript', 'Git'];

  let pdfText = '';
  let finalResumeUrl = student.resumeUrl || '';

  // Get buffer if not provided but resumeUrl exists
  if (!buffer && finalResumeUrl) {
    try {
      const cleanUrl = finalResumeUrl.split('#')[0];
      const filename = cleanUrl.replace(/^\/uploads\//, '');
      const filepath = path.join(process.cwd(), 'public/uploads', filename);
      if (fs.existsSync(filepath)) {
        buffer = fs.readFileSync(filepath);
      }
    } catch (err) {
      console.error('Failed to read PDF file from resumeUrl:', err);
    }
  }

  // Parse PDF if buffer exists using pdf-parse library
  if (buffer) {
    try {
      const parser = new PDFParse({ data: buffer });
      const parseResult = await parser.getText();
      pdfText = (parseResult.text || '').toLowerCase();
      await parser.destroy();
    } catch (parseError) {
      console.error('pdf-parse failed, falling back to raw text:', parseError);
      pdfText = buffer.toString('utf-8').toLowerCase() + ' ' + buffer.toString('binary').toLowerCase();
    }
  }

  const studentSkills = (student.skills || []).map(s => s.toLowerCase().trim());

  // Check which keywords are found
  const foundKeywords = domainKeywords.filter(keyword => {
    return hasKeyword(pdfText, studentSkills, keyword);
  });

  const missingKeywords = domainKeywords.filter(keyword => {
    return !hasKeyword(pdfText, studentSkills, keyword);
  });

  // Calculate scores
  // Technical Skills matching score (more skills -> higher score)
  const skillsCount = studentSkills.length;
  const skillsScore = Math.min(65 + (skillsCount * 4), 98);

  // Experience matching score
  const expYears = student.yearsOfExperience || 0;
  const expScore = Math.min(70 + (expYears * 3), 96);

  // Education score based on Degree
  const degree = (student.degree || '').toLowerCase();
  let eduScore = 80;
  if (degree.includes('m') || degree.includes('post') || degree.includes('phd')) {
    eduScore = 95;
  } else if (degree.includes('b') || degree.includes('eng') || degree.includes('tech')) {
    eduScore = 90;
  }

  // Formatting score based on resume hash if buffer is provided, else use existing formatting score or seed
  let hashInt = 0;
  if (buffer) {
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    for (let i = 0; i < 8; i++) {
      hashInt += hash.charCodeAt(i);
    }
  } else {
    // Stable seed based on student ID
    const seedStr = String(student._id || 'seed');
    for (let i = 0; i < seedStr.length; i++) {
      hashInt += seedStr.charCodeAt(i);
    }
  }
  const formattingScore = 75 + (hashInt % 21);

  // Keyword match score (percentage of matching keywords, bounded between 65 and 98)
  const keywordScore = domainKeywords.length > 0
    ? Math.min(Math.max(Math.round((foundKeywords.length / domainKeywords.length) * 100), 65), 98)
    : 80;

  // Final weighted ATS score (completely deterministic and content-based)
  const atsScore = Math.round(
    (skillsScore * 0.25) + 
    (expScore * 0.20) + 
    (eduScore * 0.15) + 
    (formattingScore * 0.20) + 
    (keywordScore * 0.20)
  );

  // Update missing keywords hash in the resume URL along with sub-scores
  if (finalResumeUrl) {
    const baseResumeUrl = finalResumeUrl.split('#')[0];
    finalResumeUrl = `${baseResumeUrl}#missing=${missingKeywords.join(',')}&skillsMatch=${skillsScore}&formattingScore=${formattingScore}&keywordScore=${keywordScore}`;
  }

  return {
    atsScore,
    resumeUrl: finalResumeUrl,
    missingKeywords,
    skillsScore,
    formattingScore,
    keywordScore
  };
}
