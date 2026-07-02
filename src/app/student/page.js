'use client';
import { TRACK_DOMAINS } from '@/lib/domainConstants';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null); // null means not enrolled, else object
  const [showAssessmentsModal, setShowAssessmentsModal] = useState(false);
  const [step, setStep] = useState(1);
  const [isOtherCollege, setIsOtherCollege] = useState(false);
  const [isOtherDegree, setIsOtherDegree] = useState(false);
  const [isOtherDepartment, setIsOtherDepartment] = useState(false);
  const [formData, setFormData] = useState({
    collegeName: '', degree: '', department: '', yearOfPassedOut: '',
    yearsOfExperience: '0', industryTrack: '',
    skills: '', preferredDomain: '', resumeUrl: ''
  });

  // Resume Upload State
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [atsScore, setAtsScore] = useState(0);
  const [interviews, setInterviews] = useState([]);

  const DEGREES = [
    "Diploma (Diploma)",
    "Diploma in Pharmacy (D.Pharm.)",
    "Bachelor of Arts (B.A.)",
    "Bachelor of Science (B.Sc.)",
    "Bachelor of Commerce (B.Com.)",
    "Bachelor of Business Administration (B.B.A.)",
    "Bachelor of Computer Applications (B.C.A.)",
    "Bachelor of Social Work (B.S.W.)",
    "Bachelor of Library and Information Science (B.Lib.I.Sc.)",
    "Bachelor of Physical Education (B.P.Ed.)",
    "Bachelor of Fine Arts (B.F.A.)",
    "Bachelor of Engineering (B.E.)",
    "Bachelor of Technology (B.Tech.)",
    "Bachelor of Architecture (B.Arch.)",
    "Bachelor of Planning (B.Plan.)",
    "Bachelor of Education (B.Ed.)",
    "Bachelor of Pharmacy (B.Pharm.)",
    "Bachelor of Science in Nursing (B.Sc. Nursing)",
    "Bachelor of Physiotherapy (B.P.T.)",
    "Bachelor of Occupational Therapy (B.O.T.)",
    "Bachelor of Medical Laboratory Technology (B.M.L.T.)",
    "Bachelor of Optometry (B.Optom.)",
    "Master of Arts (M.A.)",
    "Master of Science (M.Sc.)",
    "Master of Commerce (M.Com.)",
    "Master of Business Administration (M.B.A.)",
    "Master of Computer Applications (M.C.A.)",
    "Master of Social Work (M.S.W.)",
    "Master of Library and Information Science (M.Lib.I.Sc.)",
    "Master of Physical Education (M.P.Ed.)",
    "Master of Engineering (M.E.)",
    "Master of Technology (M.Tech.)",
    "Master of Architecture (M.Arch.)",
    "Master of Planning (M.Plan.)",
    "Master of Education (M.Ed.)",
    "Master of Pharmacy (M.Pharm.)",
    "Master of Science in Nursing (M.Sc. Nursing)",
    "Master of Physiotherapy (M.P.T.)",
    "Doctor of Philosophy (Ph.D.)",
    "Doctor of Science (D.Sc.)"
  ];

  const DEPARTMENTS = [
    "Accounting",
    "Actuarial Science",
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Agricultural Engineering",
    "Automobile Engineering",
    "Biomedical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Engineering",
    "Computer Science and Engineering (CSE)",
    "Electrical and Electronics Engineering (EEE)",
    "Electrical Engineering",
    "Electronics and Communication Engineering (ECE)",
    "Electronics and Instrumentation Engineering (EIE)",
    "Environmental Engineering",
    "Industrial Engineering",
    "Information Technology (IT)",
    "Instrumentation Engineering",
    "Marine Engineering",
    "Mechanical Engineering",
    "Mechatronics Engineering",
    "Printing Technology",
    "Robotics",
    "Software Engineering",
    "Telecommunication Engineering",
    "Textile Technology",
    "Web Technology",
    "Wireless Communication",
    "Artificial Intelligence (AI)",
    "Artificial Intelligence and Machine Learning (AI & ML)",
    "AI and Data Science (AI & DS)",
    "Cloud Computing",
    "Cyber Security",
    "Cyber Security and Digital Forensics",
    "Data Analytics",
    "Data Science",
    "Game Development",
    "Machine Learning",
    "Networking",
    "Agriculture",
    "Agribusiness Management",
    "Agricultural Science",
    "Biochemistry",
    "Bioinformatics",
    "Biotechnology",
    "Botany",
    "Chemistry",
    "Computer Science",
    "Economics",
    "English",
    "Environmental Science",
    "Fine Arts",
    "Food Science",
    "Forensic Science",
    "French",
    "Geography",
    "Geology",
    "German",
    "Graphic Design",
    "Hindi",
    "History",
    "Home Science",
    "Information Science",
    "Journalism",
    "Journalism and Mass Communication (JMC)",
    "Kannada",
    "Library and Information Science (LIS)",
    "Linguistics",
    "Mass Communication",
    "Mathematics",
    "Media Studies",
    "Microbiology",
    "Multimedia",
    "Music",
    "Nanotechnology",
    "Nutrition and Dietetics",
    "Painting",
    "Performing Arts",
    "Philosophy",
    "Physics",
    "Political Science",
    "Psychology",
    "Public Administration",
    "Public Health",
    "Rural Development",
    "Sanskrit",
    "Social Work",
    "Sociology",
    "Special Education",
    "Speech and Hearing",
    "Statistics",
    "Tamil",
    "Theology",
    "Tourism",
    "Tourism and Travel Management",
    "Urdu",
    "Veterinary Science",
    "Visual Communication",
    "Women's Studies",
    "Yoga",
    "Zoology",
    "Commerce",
    "Commerce with Accounting and Finance",
    "Commerce with Banking Management",
    "Commerce with Business Analytics",
    "Commerce with Computer Applications",
    "Commerce with Information Technology",
    "Computer Applications",
    "Education",
    "Teacher Education",
    "Business Administration",
    "Business Analytics",
    "Digital Marketing",
    "Finance",
    "Healthcare Management",
    "Hospital Administration",
    "Hospital Management",
    "Hospitality Management",
    "Human Resource Management (HRM)",
    "International Business",
    "Logistics and Supply Chain Management",
    "Marketing",
    "Operations Management",
    "Supply Chain Management",
    "Pharmaceutical Chemistry",
    "Pharmaceutical Technology",
    "Pharmacognosy",
    "Pharmacology",
    "Pharmacy",
    "Pharmaceutics",
    "Pharmacovigilance",
    "Nursing",
    "Cardiac Technology",
    "Clinical Laboratory Technology",
    "Clinical Nutrition",
    "Dentistry",
    "Emergency Care Technology",
    "Health Information Management",
    "Medical Imaging Technology",
    "Medical Laboratory Technology (MLT)",
    "Medical Physics",
    "Occupational Therapy (OT)",
    "Optometry",
    "Paramedical Science",
    "Physician Assistant",
    "Physiotherapy",
    "Radiology and Imaging Technology",
    "Research Methodology",
    "Interdisciplinary Research"
  ];

  const COLLEGES = [
    "Cardamom Planters' Association (CPA) College,Bodinayakanur",
    "Hajee Karutha Rowther Howdia College,Uthamapalayam",
    "Government Arts and Science College,Andipatti",
    "Government Arts and Science College,Kottur",
    "Government Arts and Science College,Veerapandi",
    "Jayaraj Annapackiam College for Women,Periyakulam",
    "Nadar Saraswathi College of Arts and Science,Theni",
    "Theni College of Arts and Science,Veerapandi",
    "Mary Matha College of Arts and Science,Periyakulam",
    "Mother Theresa Arts and Science College,T. Sindalacheri",
    "Jeyaraj Chelladurai College of Arts and Science,Theni",
    "Sri Adi Chunchanagiri Women's College,Cumbum",
    "Thiravium College of Arts & Science for Women,Theni",
    "Government College of Engineering,Theni",
    "Bharath Niketan Engineering College,Andipatti",
    "Theni Kammavar Sangam College of Technology,Theni",
    "Odaiyappa College of Engineering and Technology,Theni",
    "Government Polytechnic College,Andipatti",
    "Government Polytechnic College,Kottur",
    "Bharath Niketan Polytechnic College,Andipatti",
    "Devangar Polytechnic College,Theni",
    "Kala Pandian Polytechnic College,Theni",
    "Thangam Muthu Polytechnic College,Periyakulam",
    "Theni Kammavar Sangam Polytechnic College,Theni",
    "Theni Government Medical College,Theni",
    "Theni Government College of Nursing,Theni",
    "Nadar Saraswathi College of Nursing,Theni",
    "Mary Matha College of Nursing,Periyakulam",
    "Nadar Saraswathi College of Pharmacy,Theni",
    "College of Pharmacy, Theni Government Medical College,Theni",
    "Horticultural College and Research Institute,Periyakulam",
    "College of Agricultural Technology,Theni",
    "District Institute of Education and Training (DIET),Uthamapalayam",
    "Theni Institute of Cooperative Management,Andipatti",
    "Madurai Kamaraj University Evening College,Periyakulam",
    "Government Industrial Training Institute (ITI),Theni",
    "Government Industrial Training Institute (ITI),Periyakulam",
    "Government Industrial Training Institute (ITI),Bodinayakanur",
    "Government Industrial Training Institute (ITI),Andipatti",
    "Government Industrial Training Institute (ITI),Cumbum",
    "Government Industrial Training Institute (ITI),Uthamapalayam",
    "Theni Institute of Management Studies,Theni",
    "Nadar Saraswathi MBA Department,Theni",
    "Government College of Engineering MBA Department,Theni",
    "Bharath Niketan MBA Department,Andipatti",
    "Theni College of Arts and Science MBA Department,Veerapandi",
    "Mother Theresa Teacher Training Institute,T. Sindalacheri",
    "Nadar Saraswathi College of Education,Theni",
    "Mary Matha College of Education,Periyakulam",
    "Others"
  ];



  const TRACKS = Object.keys(TRACK_DOMAINS);

  const [customDomain, setCustomDomain] = useState('');

  const handleTrackChange = (track) => {
    setFormData(prev => ({
      ...prev,
      industryTrack: track,
      preferredDomain: ''
    }));
    setCustomDomain('');
  };

  const handleDomainSelect = (domain) => {
    if (domain === 'Others') {
      setFormData(prev => ({ ...prev, preferredDomain: 'Others' }));
      setCustomDomain('');
    } else {
      setFormData(prev => ({ ...prev, preferredDomain: domain }));
      setCustomDomain('');
    }
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      if (selected.size > 4 * 1024 * 1024) {
        alert("File size must be less than 4MB. Vercel limits uploads to 4MB.");
        return;
      }
      setFile(selected);
      await handleUploadAndScan(selected);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  const handleUploadAndScan = async (selectedFile) => {
    setUploading(true);
    setScanProgress(0);
    
    // Simulate scan progress animation
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) return prev; // Hold at 90% until backend responds
        return prev + 10;
      });
    }, 300);

    try {
      const formDataObj = new FormData();
      formDataObj.append('resume', selectedFile);

      const res = await fetch('/api/student/resume', {
        method: 'POST',
        body: formDataObj,
      });

      const data = await res.json();
      
      clearInterval(progressInterval);
      setScanProgress(100);

      if (data.success) {
        setTimeout(() => {
          setFormData(prev => ({ ...prev, resumeUrl: data.resumeUrl }));
          setAtsScore(data.atsScore);
          setUploading(false);
        }, 800); // give time for 100% animation to show
      } else {
        alert(data.message);
        setUploading(false);
        setFile(null);
      }

    } catch (error) {
      clearInterval(progressInterval);
      setUploading(false);
      setFile(null);
      alert('Upload failed');
    }
  };

  // Compute the final domain value for submission
  const getFinalDomain = () => {
    if (formData.preferredDomain === 'Others') {
      return customDomain.trim();
    }
    return formData.preferredDomain;
  };

  const isDomainValid = formData.preferredDomain && (formData.preferredDomain !== 'Others' || customDomain.trim().length > 0);

  useEffect(() => {
    if (!authLoading && user && user.role === 'student') {
      fetchEnrollmentStatus();
    } else if (!authLoading && !user) {
      setProfileLoading(false);
    }
  }, [user, authLoading]);

  const fetchInterviews = async () => {
    try {
      const res = await fetch('/api/student/interviews');
      const data = await res.json();
      if (data.success) {
        setInterviews(data.interviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
    }
  };

  const fetchEnrollmentStatus = async () => {
    try {
      const res = await fetch('/api/student/enrollment');
      const data = await res.json();
      if (data.enrolled) {
        setEnrollmentStatus({ ...data.student, assessments: data.assessments || [] });
        fetchInterviews();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEnrollmentSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      // Convert comma separated skills to array
      const payload = {
        ...formData,
        preferredDomain: getFinalDomain(),
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      };

      const res = await fetch('/api/student/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setEnrollmentStatus(data.student);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Submission failed');
    } finally {
      setProfileLoading(false);
    }
  };

  if (authLoading || profileLoading) return <div className="p-8 text-center text-slate-500">Loading your profile...</div>;

  if (enrollmentStatus) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Student Dashboard</h1>
        
        {enrollmentStatus.enrollmentStatus === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl shadow-sm mb-6">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Enrollment Pending Approval
            </h3>
            <p className="text-sm">Your profile has been submitted and is currently under review by the Administrator. You will be able to access assessments and job applications once approved.</p>
          </div>
        )}

        {enrollmentStatus.enrollmentStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl shadow-sm mb-6">
            <h3 className="font-bold text-lg mb-2">Enrollment Rejected</h3>
            <p className="text-sm">Unfortunately, your enrollment application was not approved. Please contact support for more details.</p>
          </div>
        )}

        {enrollmentStatus.enrollmentStatus === 'approved' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
            {/* Banner Section */}
            <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-indigo-900 mb-2 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-transparent z-10 p-8 flex flex-col justify-center">
                <h2 className="text-3xl font-black text-white">Dashboard</h2>
                <p className="text-indigo-200 mt-1">Welcome back, {user?.name}! Here's your progress overview.</p>
              </div>
              {/* Optional: Add temple background image here if available, or just use gradient */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
            </div>

            {/* Top 3 Metric Cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 relative overflow-hidden">
              {/* Card 1 */}
              <div className="flex-1 p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assessment</h3>
                  <div className="text-2xl font-black text-indigo-700 leading-tight mt-1">{enrollmentStatus.assessmentScore || 0}%</div>
                  <p className="text-slate-500 text-xs mt-0.5">Score</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex-1 p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Placement Status</h3>
                  <div className="text-xl font-black text-emerald-600 capitalize leading-tight mt-1">{enrollmentStatus.placementStatus}</div>
                  <p className="text-emerald-700 text-xs font-bold mt-0.5">Active & Ready</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex-[1.5] p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 z-10">
                  <div className="w-14 h-14 border-2 border-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Career Track</h3>
                    <div className="text-xl font-black text-slate-800 leading-tight mt-1">{enrollmentStatus.preferredDomain}</div>
                    <p className="text-purple-600 text-xs font-bold mt-0.5">{enrollmentStatus.industryTrack} Track</p>
                  </div>
                </div>
                {/* Decorative Illustration placeholder */}
                <div className="hidden lg:block w-32 h-32 bg-purple-50 rounded-2xl absolute right-0 bottom-0 opacity-50 transform translate-x-4 translate-y-4"></div>
              </div>
            </div>

            {/* 5 Small Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                </div>
                <div className="text-2xl font-black text-indigo-700">{enrollmentStatus.assessments?.length || 1}</div>
                <div className="text-xs font-semibold text-slate-400 mt-1">Total Assessments</div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                </div>
                <div className="text-2xl font-black text-amber-600">{enrollmentStatus.assessmentScore || 50}%</div>
                <div className="text-xs font-semibold text-slate-400 mt-1">Highest Score</div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                </div>
                <div className="text-2xl font-black text-blue-600">50%</div>
                <div className="text-xs font-semibold text-slate-400 mt-1">Average Score</div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="text-2xl font-black text-emerald-600">0/3</div>
                <div className="text-xs font-semibold text-slate-400 mt-1">Completed Levels</div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="text-2xl font-black text-rose-600">3</div>
                <div className="text-xs font-semibold text-slate-400 mt-1">Pending Levels</div>
              </div>
            </div>

            {/* Upcoming Interviews & Self-Assessment Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Interviews */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    Upcoming Interviews
                  </h3>
                  
                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                    {interviews.filter(i => i.status === 'scheduled' || i.status === 'rescheduled').length > 0 ? (
                      interviews.filter(i => i.status === 'scheduled' || i.status === 'rescheduled').slice(0, 3).map((item, index) => (
                        <div key={index} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex justify-between items-start gap-3">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.companyId?.companyName || 'Company'}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{item.driveId?.jobRole || 'Job Position'} ({item.type || 'Round'})</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {new Date(item.date).toLocaleDateString()} @ {item.startTime}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${item.mode === 'online' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {item.mode}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <svg className="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        <p className="text-xs font-semibold">No upcoming interviews scheduled yet.</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Keep applying to recruitment drives!</p>
                      </div>
                    )}
                  </div>
                </div>
                {interviews.filter(i => i.status === 'scheduled' || i.status === 'rescheduled').length > 0 && (
                  <button 
                    onClick={() => router.push('/student/interviews')}
                    className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-xl transition-all"
                  >
                    View All Interviews
                  </button>
                )}
              </div>

              {/* Self-Assessment Progress & Quick Start */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    Self-Assessment Progress
                  </h3>
                  
                  {/* Visual Progress Bar */}
                  <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-emerald-800">Overall Progress</span>
                      <span className="text-xs font-black text-emerald-700">{Math.round((enrollmentStatus.assessments?.filter(a => a.status === 'completed').length || 0) / 3 * 100)}%</span>
                    </div>
                    <div className="w-full bg-emerald-100/60 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${((enrollmentStatus.assessments?.filter(a => a.status === 'completed').length || 0) / 3 * 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-emerald-600 mt-2 font-semibold">
                      <span>{enrollmentStatus.assessments?.filter(a => a.status === 'completed').length || 0} Level(s) Cleared</span>
                      <span>{3 - (enrollmentStatus.assessments?.filter(a => a.status === 'completed').length || 0)} Level(s) Left</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                    Assessments help evaluate your readiness for job placements. Clear all 3 levels to unlock top rankings!
                  </p>
                </div>

                <button
                  onClick={() => router.push('/student/self-assessment')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 relative z-10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {enrollmentStatus.assessments?.filter(a => a.status === 'completed').length > 0 ? 'Continue Self-Assessment' : 'Start Self-Assessment'}
                </button>

                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none w-40 h-40 bg-[url('https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-left"></div>
              </div>
            </div>



            {/* Assessments Modal */}
            {showAssessmentsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-350 border border-slate-100">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-2xl font-black text-slate-800">Assessment History</h3>
                    <button 
                      onClick={() => setShowAssessmentsModal(false)}
                      className="text-slate-400 hover:text-slate-650 transition-colors p-2 rounded-full hover:bg-slate-150"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                    {enrollmentStatus.assessments && enrollmentStatus.assessments.length > 0 ? (
                      enrollmentStatus.assessments.map((attempt, index) => (
                        <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{attempt.domain || 'General Assessment'}</div>
                            <div className="text-sm font-semibold text-slate-700">Attempted on {new Date(attempt.submissionTimestamp || attempt.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${attempt.passFail === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              {attempt.passFail}
                            </span>
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-slate-800 shadow-sm">
                              {attempt.percentage || attempt.score}%
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-500 font-medium">No assessment history available.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    );
  }

  // Enrollment Form
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete Your Profile</h2>
        <p className="text-slate-500 mb-8">You need to complete your enrollment to access the platform features.</p>
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
        </div>

        <form onSubmit={step === 2 ? handleEnrollmentSubmit : (e) => { e.preventDefault(); setStep(2); }}>
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="font-semibold text-lg text-slate-700 border-b pb-2">Academic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">College Name</label>
                  {!isOtherCollege ? (
                    <div className="relative">
                      <input 
                        required 
                        type="text" 
                        list="college-list" 
                        placeholder="Select College Name" 
                        value={formData.collegeName} 
                        onChange={e => {
                          if (e.target.value === 'Others') {
                            setIsOtherCollege(true);
                            setFormData({...formData, collegeName: ''});
                          } else {
                            setFormData({...formData, collegeName: e.target.value});
                          }
                        }} 
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                      <datalist id="college-list">
                        {COLLEGES.map(college => (
                          <option key={college} value={college} />
                        ))}
                        <option value="Others" />
                      </datalist>
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        required 
                        type="text" 
                        placeholder="Enter your college name" 
                        value={formData.collegeName} 
                        onChange={e => setFormData({...formData, collegeName: e.target.value})} 
                        className="w-full px-4 py-2.5 pr-28 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsOtherCollege(false);
                          setFormData({...formData, collegeName: ''});
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-indigo-700 hover:text-indigo-900 font-bold px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{!isOtherDegree ? 'Degree' : 'Specify Degree'}</label>
                  {!isOtherDegree ? (
                    <div className="relative">
                      <input 
                        required 
                        type="text" 
                        list="degree-list" 
                        placeholder="Select Degree" 
                        value={formData.degree} 
                        onChange={e => {
                          if (e.target.value === 'Others') {
                            setIsOtherDegree(true);
                            setFormData({...formData, degree: ''});
                          } else {
                            setFormData({...formData, degree: e.target.value});
                          }
                        }} 
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                      <datalist id="degree-list">
                        {DEGREES.map(degree => (
                          <option key={degree} value={degree} />
                        ))}
                        <option value="Others" />
                      </datalist>
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        required 
                        type="text" 
                        placeholder="Enter your Degree" 
                        value={formData.degree} 
                        onChange={e => setFormData({...formData, degree: e.target.value})} 
                        className="w-full px-4 py-2.5 pr-28 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsOtherDegree(false);
                          setFormData({...formData, degree: ''});
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-indigo-700 hover:text-indigo-900 font-bold px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{!isOtherDepartment ? 'Department' : 'Specify Department'}</label>
                  {!isOtherDepartment ? (
                    <div className="relative">
                      <input 
                        required 
                        type="text" 
                        list="department-list" 
                        placeholder="Select Department" 
                        value={formData.department} 
                        onChange={e => {
                          if (e.target.value === 'Others') {
                            setIsOtherDepartment(true);
                            setFormData({...formData, department: ''});
                          } else {
                            setFormData({...formData, department: e.target.value});
                          }
                        }} 
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                      <datalist id="department-list">
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept} />
                        ))}
                        <option value="Others" />
                      </datalist>
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        required 
                        type="text" 
                        placeholder="Enter your Department" 
                        value={formData.department} 
                        onChange={e => setFormData({...formData, department: e.target.value})} 
                        className="w-full px-4 py-2.5 pr-28 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsOtherDepartment(false);
                          setFormData({...formData, department: ''});
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-indigo-700 hover:text-indigo-900 font-bold px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year of Passed Out</label>
                  <input required type="number" min="2000" max="2035" placeholder="e.g. 2026" value={formData.yearOfPassedOut} onChange={e => setFormData({...formData, yearOfPassedOut: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full mt-6 bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 transition-colors">Next Step: Skills & Domain</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="font-semibold text-lg text-slate-700 border-b pb-2">Professional Details</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Industry Track</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TRACKS.map(track => (
                    <label key={track} className={`cursor-pointer border rounded-lg px-4 py-3 text-sm text-center transition-colors ${formData.industryTrack === track ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                      <input type="radio" name="industryTrack" className="hidden" checked={formData.industryTrack === track} onChange={() => handleTrackChange(track)} required />
                      {track}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma separated)</label>
                <input required type="text" placeholder="React, Node.js, Python" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
                <input required type="number" min="0" max="45" placeholder="e.g. 2 (use 0 for fresher)" value={formData.yearsOfExperience} onChange={e => setFormData({...formData, yearsOfExperience: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Domain</label>
                {!formData.industryTrack ? (
                  <div className="text-sm text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center">
                    Please select an Industry Track first.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {TRACK_DOMAINS[formData.industryTrack].map(domain => (
                        <label key={domain} className={`cursor-pointer border rounded-lg px-3 py-2 text-sm text-center transition-colors ${formData.preferredDomain === domain ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                          <input type="radio" name="domain" className="hidden" checked={formData.preferredDomain === domain} onChange={() => handleDomainSelect(domain)} />
                          {domain}
                        </label>
                      ))}
                    </div>
                    {formData.preferredDomain === 'Others' && (
                      <input
                        type="text"
                        required
                        value={customDomain}
                        onChange={e => setCustomDomain(e.target.value)}
                        placeholder="Enter your preferred domain"
                        className="w-full mt-3 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Resume (PDF)</label>
                {!uploading ? (
                  <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group overflow-hidden">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      </div>
                      <p className="mb-1 text-sm font-bold text-slate-700">
                        {formData.resumeUrl ? 'Resume Uploaded! Click to replace' : 'Click to upload or drag PDF'}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="w-full h-32 border-2 border-indigo-200 bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                    <svg className="w-8 h-8 text-indigo-500 mb-2 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    <div className="w-full max-w-xs bg-indigo-200/50 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${scanProgress}%` }}></div>
                    </div>
                    <div className="text-xs font-bold text-indigo-500 mt-2">Uploading Resume... {scanProgress}%</div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors">Back</button>
                <button type="submit" disabled={!isDomainValid || !formData.resumeUrl || profileLoading || uploading} className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {profileLoading ? 'Submitting...' : 'Submit Enrollment'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
