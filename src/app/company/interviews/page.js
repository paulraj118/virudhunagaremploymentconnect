'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CompanyInterviewsDashboard() {
  const router = useRouter();
  
  // State variables
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tab states: 'list', 'calendar', 'analytics'
  const [activeTab, setActiveTab] = useState('list');
  
  // Calendar states
  const [calendarView, setCalendarView] = useState('month'); // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [roundFilter, setRoundFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [candidateFilter, setCandidateFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All'); // maps to company/dept filter
  
  // Sorting & Pagination
  const [sortField, setSortField] = useState('interviewDate');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  // Modals / Drawer states
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  
  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    candidateId: '',
    jobId: '',
    applicationId: '',
    assessmentResultId: '',
    technicalAttemptId: '',
    interviewType: 'Technical',
    interviewRound: 'Technical Round 1',
    interviewDate: '',
    interviewTime: '',
    duration: 45,
    timezone: 'IST',
    interviewMode: 'Online',
    meetingLink: '',
    meetingPlatform: 'Google Meet',
    venue: '',
    venueAddress: '',
    interviewerName: '',
    interviewerEmail: '',
    interviewerDesignation: '',
    interviewInstructions: '',
    status: 'Scheduled'
  });
  
  const [rescheduleForm, setRescheduleForm] = useState({
    interviewDate: '',
    interviewTime: '',
    duration: 45,
    interviewMode: 'Online',
    meetingLink: '',
    meetingPlatform: 'Google Meet',
    venue: '',
    venueAddress: '',
    remarks: ''
  });
  
  const [feedbackForm, setFeedbackForm] = useState({
    communication: 5,
    technicalKnowledge: 5,
    problemSolving: 5,
    confidence: 5,
    professionalism: 5,
    strengths: '',
    weaknesses: '',
    hrRemarks: '',
    remarks: '',
    status: 'Completed'
  });
  
  const [cancelRemarks, setCancelRemarks] = useState('');
  
  // Load data
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Interviews
      const intRes = await fetch('/api/company/interviews');
      if (intRes.status === 401) {
        router.push('/login');
        return;
      }
      const intData = await intRes.json();
      if (intData.success) {
        setInterviews(intData.data || intData.interviews || []);
      } else {
        setError(intData.message || 'Failed to load interviews.');
      }
      
      // 2. Fetch Job Applications (Shortlisted candidates to schedule)
      const appRes = await fetch('/api/company/applications');
      const appData = await appRes.json();
      if (appData.success) {
        setApplications(appData.applications || []);
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred while loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };
  
  // Re-fetch only interviews list
  const refreshInterviews = async () => {
    try {
      const res = await fetch('/api/company/interviews');
      const data = await res.json();
      if (data.success) {
        setInterviews(data.data || data.interviews || []);
      }
    } catch (err) {
      console.error('Failed refreshing interviews:', err);
    }
  };
  
  // Handler Actions
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/company/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsScheduleModalOpen(false);
        // Reset form
        setScheduleForm({
          candidateId: '',
          jobId: '',
          applicationId: '',
          assessmentResultId: '',
          technicalAttemptId: '',
          interviewType: 'Technical',
          interviewRound: 'Technical Round 1',
          interviewDate: '',
          interviewTime: '',
          duration: 45,
          timezone: 'IST',
          interviewMode: 'Online',
          meetingLink: '',
          meetingPlatform: 'Google Meet',
          venue: '',
          venueAddress: '',
          interviewerName: '',
          interviewerEmail: '',
          interviewerDesignation: '',
          interviewInstructions: '',
          status: 'Scheduled'
        });
        fetchInitialData();
      } else {
        alert(data.message || 'Failed to schedule interview');
      }
    } catch (err) {
      console.error(err);
      alert('Error scheduling interview');
    }
  };
  
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;
    try {
      const res = await fetch(`/api/company/interviews/${selectedInterview._id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rescheduleForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsRescheduleModalOpen(false);
        if (isDrawerOpen) {
          // Refresh drawer data
          const detailRes = await fetch(`/api/company/interviews/${selectedInterview._id}`);
          const detailData = await detailRes.json();
          if (detailData.success) setSelectedInterview(detailData.data);
        }
        fetchInitialData();
      } else {
        alert(data.message || 'Failed to reschedule');
      }
    } catch (err) {
      console.error(err);
      alert('Error rescheduling interview');
    }
  };
  
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;
    try {
      const res = await fetch(`/api/company/interviews/${selectedInterview._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: cancelRemarks })
      });
      const data = await res.json();
      if (data.success) {
        setIsCancelModalOpen(false);
        setCancelRemarks('');
        if (isDrawerOpen) {
          const detailRes = await fetch(`/api/company/interviews/${selectedInterview._id}`);
          const detailData = await detailRes.json();
          if (detailData.success) setSelectedInterview(detailData.data);
        }
        fetchInitialData();
      } else {
        alert(data.message || 'Failed to cancel');
      }
    } catch (err) {
      console.error(err);
      alert('Error cancelling interview');
    }
  };
  
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;
    try {
      const res = await fetch(`/api/company/interviews/${selectedInterview._id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsFeedbackModalOpen(false);
        // Reset feedback form
        setFeedbackForm({
          communication: 5,
          technicalKnowledge: 5,
          problemSolving: 5,
          confidence: 5,
          professionalism: 5,
          strengths: '',
          weaknesses: '',
          hrRemarks: '',
          remarks: '',
          status: 'Completed'
        });
        if (isDrawerOpen) {
          const detailRes = await fetch(`/api/company/interviews/${selectedInterview._id}`);
          const detailData = await detailRes.json();
          if (detailData.success) setSelectedInterview(detailData.data);
        }
        fetchInitialData();
      } else {
        alert(data.message || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting feedback');
    }
  };
  
  const handleDecisionAction = async (decision) => {
    if (!selectedInterview) return;
    const confirmMsg = `Are you sure you want to mark this candidate as ${decision}?`;
    if (!window.confirm(confirmMsg)) return;
    
    let url = `/api/company/interviews/${selectedInterview._id}/`;
    if (decision === 'Selected') url += 'select';
    else if (decision === 'Rejected') url += 'reject';
    else if (decision === 'Hold') url += 'hold';
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: `Marked as ${decision} via Quick Actions` })
      });
      const data = await res.json();
      if (data.success) {
        if (isDrawerOpen) {
          const detailRes = await fetch(`/api/company/interviews/${selectedInterview._id}`);
          const detailData = await detailRes.json();
          if (detailData.success) setSelectedInterview(detailData.data);
        }
        fetchInitialData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting decision');
    }
  };
  
  const handleAppSelectForSchedule = (appId) => {
    const app = applications.find(a => a._id === appId);
    if (!app) return;
    setScheduleForm({
      ...scheduleForm,
      applicationId: app._id,
      candidateId: app.studentId?.userId?._id || '',
      jobId: app.jobId?._id || '',
      assessmentResultId: app.assessmentResult?._id || '',
      technicalAttemptId: app.technicalTestId || '' // technicalTestId from JobApplication
    });
  };
  
  const openFeedbackForm = (inv) => {
    setSelectedInterview(inv);
    setFeedbackForm({
      communication: inv.feedback?.communication || 5,
      technicalKnowledge: inv.feedback?.technicalKnowledge || 5,
      problemSolving: inv.feedback?.problemSolving || 5,
      confidence: inv.feedback?.confidence || 5,
      professionalism: inv.feedback?.professionalism || 5,
      strengths: inv.feedback?.strengths || '',
      weaknesses: inv.feedback?.weaknesses || '',
      hrRemarks: inv.feedback?.hrRemarks || '',
      remarks: inv.feedback?.remarks || '',
      status: inv.status === 'Completed' || inv.status === 'Selected' || inv.status === 'Rejected' || inv.status === 'Hold' ? inv.status : 'Completed'
    });
    setIsFeedbackModalOpen(true);
  };
  
  const openRescheduleForm = (inv) => {
    setSelectedInterview(inv);
    setRescheduleForm({
      interviewDate: inv.interviewDate ? new Date(inv.interviewDate).toISOString().split('T')[0] : '',
      interviewTime: inv.interviewTime || '',
      duration: inv.duration || 45,
      interviewMode: inv.interviewMode || 'Online',
      meetingLink: inv.meetingLink || '',
      meetingPlatform: inv.meetingPlatform || 'Google Meet',
      venue: inv.venue || '',
      venueAddress: inv.venueAddress || '',
      remarks: ''
    });
    setIsRescheduleModalOpen(true);
  };
  
  const openCancelForm = (inv) => {
    setSelectedInterview(inv);
    setCancelRemarks('');
    setIsCancelModalOpen(true);
  };
  
  const openDetailsDrawer = async (inv) => {
    setSelectedInterview(inv);
    setIsDrawerOpen(true);
    
    // Fetch fresh populate details
    try {
      const res = await fetch(`/api/company/interviews/${inv._id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedInterview(data.data);
      }
    } catch (e) {
      console.error('Drawer details fetch failed:', e);
    }
  };
  
  // Calculated Score
  const currentCalculatedScore = Number(feedbackForm.communication) +
    Number(feedbackForm.technicalKnowledge) +
    Number(feedbackForm.problemSolving) +
    Number(feedbackForm.confidence) +
    Number(feedbackForm.professionalism);
    
  // Metrics calculations
  const calculateMetrics = () => {
    const todayStr = new Date().toDateString();
    
    let total = interviews.length;
    let scheduled = 0;
    let today = 0;
    let completed = 0;
    let cancelled = 0;
    let selected = 0;
    let rejected = 0;
    let hold = 0;
    
    interviews.forEach(inv => {
      const invDateStr = new Date(inv.interviewDate).toDateString();
      
      if (inv.status === 'Scheduled' || inv.status === 'Rescheduled') scheduled++;
      if (invDateStr === todayStr && inv.status !== 'Cancelled') today++;
      if (inv.status === 'Completed') completed++;
      if (inv.status === 'Cancelled') cancelled++;
      if (inv.status === 'Selected') selected++;
      if (inv.status === 'Rejected') rejected++;
      if (inv.status === 'Hold') hold++;
    });
    
    return { total, scheduled, today, completed, cancelled, selected, rejected, hold };
  };
  
  const metrics = calculateMetrics();
  
  // Status Colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Rescheduled': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'In Progress': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Completed': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Selected': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'Hold': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'No Show': return 'bg-zinc-100 text-zinc-700 border-zinc-300';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };
  
  const getStatusCalendarColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-500 border-blue-600 text-white';
      case 'Rescheduled': return 'bg-indigo-500 border-indigo-600 text-white';
      case 'Cancelled': return 'bg-red-500 border-red-600 text-white';
      case 'Completed': return 'bg-teal-500 border-teal-600 text-white';
      case 'Selected': return 'bg-emerald-500 border-emerald-600 text-white';
      case 'Rejected': return 'bg-rose-500 border-rose-600 text-white';
      case 'Hold': return 'bg-amber-500 border-amber-600 text-white';
      default: return 'bg-slate-500 border-slate-600 text-white';
    }
  };
  
  // Filtering & Sorting Logical flow
  const filteredInterviews = interviews.filter(inv => {
    const candidateName = (inv.candidateId?.name || inv.studentId?.userId?.name || '').toLowerCase();
    const interviewer = (inv.interviewerName || '').toLowerCase();
    const jobRoleName = (inv.jobId?.title || inv.driveId?.jobRole || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    // Search match
    const matchesSearch = candidateName.includes(query) || interviewer.includes(query) || jobRoleName.includes(query);
    
    // Status Filter
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    
    // Mode Filter
    const matchesMode = modeFilter === 'All' || inv.interviewMode === modeFilter;
    
    // Round Filter
    const matchesRound = roundFilter === 'All' || inv.interviewRound === roundFilter;
    
    // Role Filter
    const matchesRole = roleFilter === 'All' || (inv.jobId?.title || inv.driveId?.jobRole) === roleFilter;
    
    // Candidate Name Filter (exact text input in filters)
    const matchesCandidate = !candidateFilter || candidateName.includes(candidateFilter.toLowerCase());
    
    // Date Range
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(inv.interviewDate) >= new Date(startDate);
    }
    if (endDate) {
      // Set end date to end of day
      const boundaryDate = new Date(endDate);
      boundaryDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(inv.interviewDate) <= boundaryDate;
    }
    
    return matchesSearch && matchesStatus && matchesMode && matchesRound && matchesRole && matchesCandidate && matchesDate;
  });
  
  // Sorting
  const sortedInterviews = [...filteredInterviews].sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];
    
    // Resolve nested fields
    if (sortField === 'candidateName') {
      fieldA = a.candidateId?.name || a.studentId?.userId?.name || '';
      fieldB = b.candidateId?.name || b.studentId?.userId?.name || '';
    } else if (sortField === 'jobRole') {
      fieldA = a.jobId?.title || a.driveId?.jobRole || '';
      fieldB = b.jobId?.title || b.driveId?.jobRole || '';
    } else if (sortField === 'score') {
      fieldA = a.feedback?.totalScore || 0;
      fieldB = b.feedback?.totalScore || 0;
    }
    
    if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedInterviews.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(sortedInterviews.length / recordsPerPage);
  
  // Unique Lists for Filter Dropdowns
  const uniqueRoles = [...new Set(interviews.map(inv => inv.jobId?.title || inv.driveId?.jobRole).filter(Boolean))];
  const uniqueRounds = [...new Set(interviews.map(inv => inv.interviewRound).filter(Boolean))];
  
  // CSV Export utility
  const exportCSV = () => {
    let headers = ['Interview ID', 'Candidate Name', 'Candidate Email', 'Job Role', 'Round', 'Date', 'Time', 'Duration', 'Mode', 'Venue/Link', 'Status', 'Interviewer Name', 'Total Evaluation Score', 'Decision'];
    let rows = sortedInterviews.map(inv => [
      inv.interviewId,
      inv.candidateId?.name || inv.studentId?.userId?.name || 'N/A',
      inv.candidateId?.email || inv.studentId?.userId?.email || 'N/A',
      inv.jobId?.title || inv.driveId?.jobRole || 'N/A',
      inv.interviewRound,
      new Date(inv.interviewDate).toLocaleDateString('en-IN'),
      inv.interviewTime,
      `${inv.duration} mins`,
      inv.interviewMode,
      inv.interviewMode === 'Online' ? inv.meetingLink : inv.venue,
      inv.status,
      inv.interviewerName,
      inv.feedback?.totalScore || 0,
      inv.status === 'Selected' ? 'Selected' : inv.status === 'Rejected' ? 'Rejected' : inv.status === 'Hold' ? 'Hold' : 'Pending'
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `interview_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // PDF Export utility (using jsPDF and jsPDF-AutoTable)
  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    doc.text('Job Fair - Interview Execution Report', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Filtered Count: ${sortedInterviews.length}`, 14, 22);
    
    const tableData = sortedInterviews.map(inv => [
      inv.interviewId,
      inv.candidateId?.name || inv.studentId?.userId?.name || 'N/A',
      inv.jobId?.title || inv.driveId?.jobRole || 'N/A',
      inv.interviewRound,
      new Date(inv.interviewDate).toLocaleDateString('en-IN'),
      inv.interviewTime,
      inv.interviewMode,
      inv.status
    ]);
    
    autoTable(doc, {
      head: [['ID', 'Candidate Name', 'Job Role', 'Round', 'Date', 'Time', 'Mode', 'Status']],
      body: tableData,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] } // indigo primary
    });
    
    doc.save(`interview_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  // Calendar Navigation helpers
  const handlePrevDate = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };
  
  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };
  
  // Calendar Monthly Matrix calculation
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Add empty padding slots for preceding month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Add days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };
  
  // Calendar Weekly Matrix calculation
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // adjust when day is sunday
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };
  
  // Analytics variables
  const statusCounts = { Scheduled: 0, Rescheduled: 0, Cancelled: 0, Completed: 0, Selected: 0, Rejected: 0, Hold: 0, Draft: 0, 'No Show': 0 };
  let selectedCount = 0;
  let rejectedCount = 0;
  let totalFinishedCount = 0;
  let totalFeedbackScore = 0;
  let totalRecruitmentScore = 0;
  let scoreSumCount = 0;
  
  const trendMap = {}; // key: YYYY-MM-DD, value: count
  
  interviews.forEach(inv => {
    statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
    if (inv.status === 'Selected') selectedCount++;
    if (inv.status === 'Rejected') rejectedCount++;
    if (['Completed', 'Selected', 'Rejected', 'Hold'].includes(inv.status)) {
      totalFinishedCount++;
      if (inv.feedback?.totalScore) {
        totalFeedbackScore += inv.feedback.totalScore;
        scoreSumCount++;
      }
    }
    
    // Trend grouping
    const dStr = new Date(inv.interviewDate).toISOString().split('T')[0];
    trendMap[dStr] = (trendMap[dStr] || 0) + 1;
  });
  
  const selectionRate = totalFinishedCount ? Math.round((selectedCount / totalFinishedCount) * 100) : 0;
  const rejectionRate = totalFinishedCount ? Math.round((rejectedCount / totalFinishedCount) * 100) : 0;
  const avgFeedbackScore = scoreSumCount ? Math.round((totalFeedbackScore / scoreSumCount) * 10) / 10 : 0;
  
  // Trend list
  const sortedTrend = Object.keys(trendMap)
    .sort()
    .slice(-10) // last 10 days
    .map(key => ({ date: key, count: trendMap[key] }));
    
  // Render loading skeleton
  if (loading) {
    return (
      <div className="w-full min-w-0 p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
        <div className="h-10 w-48 bg-slate-200 rounded animate-pulse mb-6"></div>
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="h-4 w-12 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-6 w-8 bg-slate-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        {/* Table Skeleton */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="h-8 w-full bg-slate-200 rounded animate-pulse"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Render Error state
  if (error) {
    return (
      <div className="w-full p-8 text-center bg-slate-50 min-h-screen flex flex-col justify-center items-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
        <p className="text-slate-500 mt-2 font-medium max-w-md">{error}</p>
        <button onClick={fetchInitialData} className="mt-4 text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 p-4 sm:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interview Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Manage schedule slots, candidate feedback evaluations, and score analytics insights.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4.5 py-2.5 rounded-xl shadow-md shadow-indigo-600/10 border border-indigo-700 transition-all hover:scale-[1.02]"
          >
            ➕ Schedule Interview
          </button>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: 'Total', count: metrics.total, color: 'text-indigo-600' },
          { label: 'Scheduled', count: metrics.scheduled, color: 'text-blue-600' },
          { label: "Today's", count: metrics.today, color: 'text-amber-600' },
          { label: 'Completed', count: metrics.completed, color: 'text-teal-600' },
          { label: 'Cancelled', count: metrics.cancelled, color: 'text-rose-600' },
          { label: 'Selected', count: metrics.selected, color: 'text-emerald-600' },
          { label: 'Rejected', count: metrics.rejected, color: 'text-red-600' },
          { label: 'Hold', count: metrics.hold, color: 'text-yellow-600' }
        ].map(item => (
          <div key={item.label} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{item.label}</span>
            <span className={`text-xl sm:text-2xl font-extrabold ${item.color} mt-1.5`}>{item.count}</span>
          </div>
        ))}
      </div>
      
      {/* Search & Filter Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <input 
              type="text"
              placeholder="Search candidate, job, interviewer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 font-medium placeholder-slate-400"
            />
          </div>
          {/* Date range inputs */}
          <div className="flex gap-2 items-center col-span-1 md:col-span-2">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold"
            />
            <span className="text-xs text-slate-400 font-bold">to</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>
        </div>
        
        {/* Advanced Filters toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 border-t border-slate-100 pt-4">
          <div>
            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1 bg-slate-50"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
              <option value="Hold">Hold</option>
              <option value="No Show">No Show</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Mode</label>
            <select 
              value={modeFilter} 
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1 bg-slate-50"
            >
              <option value="All">All Modes</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Job Role</label>
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1 bg-slate-50"
            >
              <option value="All">All Roles</option>
              {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Interview Round</label>
            <select 
              value={roundFilter} 
              onChange={(e) => setRoundFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1 bg-slate-50"
            >
              <option value="All">All Rounds</option>
              {uniqueRounds.map(round => <option key={round} value={round}>{round}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Candidate Name</label>
            <input 
              type="text"
              placeholder="Filter name..."
              value={candidateFilter}
              onChange={(e) => setCandidateFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1 bg-slate-50"
            />
          </div>
        </div>
      </div>
      
      {/* Tabs Switcher & Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white px-5 py-3 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex gap-2">
          {['list', 'calendar', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4.5 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {tab === 'list' ? '📋 List View' : tab === 'calendar' ? '📅 Calendar View' : '📊 Analytics'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={exportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-3 py-2 rounded-lg border border-slate-200"
          >
            📥 Export CSV
          </button>
          <button 
            onClick={exportPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-3 py-2 rounded-lg border border-slate-200"
          >
            📥 Export PDF
          </button>
        </div>
      </div>
      
      {/* Active Tab Panel */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  {/* Headers with sorting logic */}
                  {[
                    { label: 'Candidate', field: 'candidateName' },
                    { label: 'Job Role', field: 'jobRole' },
                    { label: 'Round', field: 'interviewRound' },
                    { label: 'Date & Time', field: 'interviewDate' },
                    { label: 'Mode', field: 'interviewMode' },
                    { label: 'Status', field: 'status' },
                    { label: 'Confirmation', field: 'confirmationStatus' },
                    { label: 'Score', field: 'score' },
                    { label: 'Actions', field: null }
                  ].map(h => (
                    <th 
                      key={h.label} 
                      onClick={() => {
                        if (!h.field) return;
                        if (sortField === h.field) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField(h.field);
                          setSortOrder('asc');
                        }
                      }}
                      className={`px-2 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${h.field ? 'cursor-pointer hover:bg-slate-100/50' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {h.label}
                        {sortField === h.field && (sortOrder === 'asc' ? '▲' : '▼')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRecords.map(inv => (
                  <tr key={inv._id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                    <td className="px-2 py-3 font-bold text-slate-800 text-sm">
                      {inv.candidateId?.name || inv.studentId?.userId?.name || 'N/A'}
                    </td>
                    <td className="px-2 py-3 font-medium text-slate-600 text-xs">
                      {inv.jobId?.title || inv.driveId?.jobRole || 'N/A'}
                    </td>
                    <td className="px-2 py-3 font-semibold text-indigo-600 text-xs">
                      {inv.interviewRound}
                    </td>
                    <td className="px-2 py-3 text-[11px] text-slate-600 space-y-0.5">
                      <div className="font-semibold">{new Date(inv.interviewDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div className="text-slate-400 whitespace-nowrap">{inv.interviewTime} | {inv.duration}m</div>
                    </td>
                    <td className="px-2 py-3 text-xs font-semibold text-slate-700">
                      {inv.interviewMode}
                    </td>
                    <td className="px-2 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        inv.confirmationStatus === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                        inv.confirmationStatus === 'Declined' ? 'bg-red-100 text-red-800' :
                        inv.confirmationStatus === 'Reschedule Requested' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {inv.confirmationStatus === 'Reschedule Requested' ? 'Resched Req' : inv.confirmationStatus}
                      </span>
                    </td>
                    <td className="px-2 py-3 font-bold text-slate-700 text-xs">
                      {inv.feedback?.totalScore ? `${inv.feedback.totalScore}/50` : '—'}
                    </td>
                    <td className="px-2 py-3 flex gap-1.5 flex-wrap w-44">
                      <button 
                        onClick={() => openDetailsDrawer(inv)}
                        className="text-[9px] font-bold uppercase bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1.5 rounded border border-slate-200"
                        title="Details"
                      >
                        🔍
                      </button>
                      
                      {/* Sub-actions based on HR Authorization checks */}
                      {['Scheduled', 'Rescheduled', 'Draft', 'In Progress'].includes(inv.status) && (
                        <>
                          <button 
                            onClick={() => openFeedbackForm(inv)}
                            className="text-[9px] font-bold uppercase bg-teal-600 hover:bg-teal-700 text-white px-2 py-1.5 rounded"
                            title="Feedback"
                          >
                            📝
                          </button>
                          <button 
                            onClick={() => openRescheduleForm(inv)}
                            className="text-[9px] font-bold uppercase bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1.5 rounded border border-indigo-200"
                            title="Reschedule"
                          >
                            🕒
                          </button>
                          <button 
                            onClick={() => openCancelForm(inv)}
                            className="text-[9px] font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1.5 rounded border border-rose-200"
                            title="Cancel"
                          >
                            ❌
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty state */}
          {sortedInterviews.length === 0 && (
            <div className="text-center py-20 text-slate-500 font-medium flex flex-col items-center justify-center bg-white">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-xl mb-3">📂</div>
              <h3 className="font-bold text-slate-800">No interviews found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">No interviews match your search query or selected active filters.</p>
            </div>
          )}
          
          {/* Pagination Footer */}
          {sortedInterviews.length > 0 && (
            <div className="bg-slate-50/75 p-4 flex justify-between items-center border-t border-slate-200 text-xs font-semibold text-slate-500">
              <span>Showing {indexOfFirstRecord + 1} - {Math.min(indexOfLastRecord, sortedInterviews.length)} of {sortedInterviews.length} entries</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ◀ Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={handlePrevDate} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold text-sm">◀</button>
              <span className="font-extrabold text-slate-800 text-base min-w-[140px] text-center uppercase tracking-wide">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={handleNextDate} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold text-sm">▶</button>
            </div>
            <div className="flex gap-1 border border-slate-200 p-1 rounded-xl bg-slate-50">
              {['month', 'week', 'day'].map(view => (
                <button
                  key={view}
                  onClick={() => setCalendarView(view)}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    calendarView === view ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
          
          {/* Monthly grid calendar */}
          {calendarView === 'month' && (
            <div className="grid grid-cols-7 gap-1 border-t border-slate-100 pt-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
                <div key={w} className="text-center font-bold text-slate-400 text-[10px] uppercase py-2 tracking-wider">{w}</div>
              ))}
              {getMonthDays().map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[90px] border border-slate-100 rounded-lg" />;
                
                // Get interviews on this day
                const dayStr = day.toDateString();
                const dayInterviews = filteredInterviews.filter(inv => new Date(inv.interviewDate).toDateString() === dayStr);
                
                return (
                  <div key={dayStr} className="bg-white min-h-[95px] border border-slate-100 rounded-lg p-2 flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <span className="text-[10px] font-bold text-slate-400">{day.getDate()}</span>
                    <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[65px] scrollbar-thin">
                      {dayInterviews.map(inv => (
                        <div 
                          key={inv._id}
                          onClick={() => openDetailsDrawer(inv)}
                          className={`text-[9px] font-bold p-1 rounded border leading-tight truncate cursor-pointer transition-all hover:scale-[1.02] ${getStatusCalendarColor(inv.status)}`}
                        >
                          {inv.interviewTime} {inv.candidateId?.name || inv.studentId?.userId?.name || 'Cand'}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Weekly calendar */}
          {calendarView === 'week' && (
            <div className="grid grid-cols-7 gap-2 border-t border-slate-100 pt-4">
              {getWeekDays().map(day => {
                const dayStr = day.toDateString();
                const dayInterviews = filteredInterviews.filter(inv => new Date(inv.interviewDate).toDateString() === dayStr);
                
                return (
                  <div key={dayStr} className="bg-white border border-slate-100 rounded-xl p-3 min-h-[300px] flex flex-col">
                    <div className="border-b border-slate-100 pb-2 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day.toLocaleString('default', { weekday: 'short' })}</div>
                      <div className="text-lg font-extrabold text-slate-800 mt-0.5">{day.getDate()}</div>
                    </div>
                    <div className="space-y-2 mt-3 flex-1 overflow-y-auto max-h-[220px]">
                      {dayInterviews.map(inv => (
                        <div 
                          key={inv._id}
                          onClick={() => openDetailsDrawer(inv)}
                          className={`p-2 rounded-lg border text-[10px] font-bold cursor-pointer hover:shadow-sm leading-snug space-y-0.5 ${getStatusCalendarColor(inv.status)}`}
                        >
                          <div className="text-[8px] opacity-90">{inv.interviewTime} | {inv.duration}m</div>
                          <div className="truncate">{inv.candidateId?.name || inv.studentId?.userId?.name || 'Candidate'}</div>
                          <div className="text-[8px] opacity-75 truncate">{inv.jobId?.title || inv.driveId?.jobRole || 'Job'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Daily View */}
          {calendarView === 'day' && (
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Daily Agenda</span>
                <span className="text-xs font-extrabold text-indigo-600">{currentDate.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredInterviews
                  .filter(inv => new Date(inv.interviewDate).toDateString() === currentDate.toDateString())
                  .sort((a, b) => a.interviewTime.localeCompare(b.interviewTime))
                  .map(inv => (
                    <div key={inv._id} onClick={() => openDetailsDrawer(inv)} className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                      <div className="flex gap-4 items-center">
                        <span className="text-xs font-extrabold text-slate-500 w-16">{inv.interviewTime}</span>
                        <div className="h-8 w-1.5 rounded bg-indigo-600" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{inv.candidateId?.name || inv.studentId?.userId?.name || 'Candidate'}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{inv.jobId?.title || inv.driveId?.jobRole} - {inv.interviewRound}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="text-xs text-slate-400 font-semibold">{inv.interviewMode}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                {filteredInterviews.filter(inv => new Date(inv.interviewDate).toDateString() === currentDate.toDateString()).length === 0 && (
                  <div className="text-center py-16 text-slate-400 font-bold text-sm bg-slate-50/20 rounded-xl border border-dashed border-slate-150">
                    No interviews scheduled for this day.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Analytics Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Placement Ratio</h4>
                <p className="text-slate-400 text-[10px] font-medium mt-0.5">Selected Candidates vs Total Finished</p>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-extrabold text-emerald-600">{selectionRate}%</span>
                <span className="text-xs text-slate-500 font-semibold">{selectedCount} selections</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectionRate}%` }} />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Rejection Ratio</h4>
                <p className="text-slate-400 text-[10px] font-medium mt-0.5">Rejected Candidates vs Total Finished</p>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-extrabold text-rose-600">{rejectionRate}%</span>
                <span className="text-xs text-slate-500 font-semibold">{rejectedCount} rejections</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${rejectionRate}%` }} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Average Evaluation Score</h4>
                <p className="text-slate-400 text-[10px] font-medium mt-0.5">Average Score out of 50</p>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-extrabold text-indigo-600">{avgFeedbackScore}</span>
                <span className="text-xs text-slate-500 font-semibold">/ 50 Max</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(avgFeedbackScore / 50) * 100}%` }} />
              </div>
            </div>
          </div>
          
          {/* Interactive SVG Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Status distribution Pie chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base">Interview Status Distribution</h3>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 py-4">
                
                {/* SVG Donut/Pie */}
                <div className="relative w-36 h-36">
                  <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                    <circle className="donut-hole" cx="21" cy="21" r="15.915" fill="#fff"></circle>
                    <circle className="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="3"></circle>
                    
                    {/* Concentric circles or segment layers */}
                    {(() => {
                      let totalInt = interviews.length || 1;
                      let accumulatedPct = 0;
                      
                      const segments = [
                        { label: 'Scheduled', val: metrics.scheduled, stroke: '#3b82f6' },
                        { label: 'Completed', val: metrics.completed, stroke: '#14b8a6' },
                        { label: 'Cancelled', val: metrics.cancelled, stroke: '#f43f5e' },
                        { label: 'Selected', val: metrics.selected, stroke: '#10b981' },
                        { label: 'Rejected', val: metrics.rejected, stroke: '#ef4444' },
                        { label: 'Hold', val: metrics.hold, stroke: '#f59e0b' }
                      ].filter(s => s.val > 0);
                      
                      return segments.map((seg, idx) => {
                        const pct = (seg.val / totalInt) * 100;
                        const strokeDash = `${pct} ${100 - pct}`;
                        const strokeOffset = 100 - accumulatedPct + 25; // 25% adjustment to start top
                        accumulatedPct += pct;
                        
                        return (
                          <circle
                            key={idx}
                            cx="21"
                            cy="21"
                            r="15.915"
                            fill="transparent"
                            stroke={seg.stroke}
                            strokeWidth="3.5"
                            strokeDasharray={strokeDash}
                            strokeDashoffset={strokeOffset}
                          />
                        );
                      });
                    })()}
                  </svg>
                </div>
                
                {/* Keys info */}
                <div className="space-y-1.5 text-xs font-semibold text-slate-500 w-full">
                  {[
                    { label: 'Scheduled', val: metrics.scheduled, color: 'bg-blue-500' },
                    { label: 'Completed', val: metrics.completed, color: 'bg-teal-500' },
                    { label: 'Cancelled', val: metrics.cancelled, color: 'bg-rose-500' },
                    { label: 'Selected', val: metrics.selected, color: 'bg-emerald-500' },
                    { label: 'Rejected', val: metrics.rejected, color: 'bg-red-500' },
                    { label: 'Hold', val: metrics.hold, color: 'bg-amber-500' }
                  ].map(k => (
                    <div key={k.label} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${k.color}`} />
                        <span>{k.label}</span>
                      </div>
                      <span className="font-extrabold text-slate-700">{k.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* SVG Trend Line Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base">Interview Scheduled Trend</h3>
              <div className="h-40 w-full pt-4">
                {sortedTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">No scheduled trend data available.</div>
                ) : (
                  <svg width="100%" height="100%" viewBox="0 0 500 120" preserveAspectRatio="none">
                    {/* Y Axis grids */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    
                    {/* SVG Line / Path */}
                    {(() => {
                      const counts = sortedTrend.map(t => t.count);
                      const maxVal = Math.max(...counts, 4);
                      const points = sortedTrend.map((t, idx) => {
                        const x = (idx / (sortedTrend.length - 1)) * 500;
                        const y = 100 - (t.count / maxVal) * 80;
                        return `${x},${y}`;
                      }).join(' ');
                      
                      return (
                        <>
                          {/* Gradient fill */}
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path
                            d={`M 0,100 L ${points} L 500,100 Z`}
                            fill="url(#areaGrad)"
                          />
                          <polyline
                            fill="none"
                            stroke="#4f46e5"
                            strokeWidth="3.5"
                            points={points}
                          />
                          {/* Point dots */}
                          {sortedTrend.map((t, idx) => {
                            const x = (idx / (sortedTrend.length - 1)) * 500;
                            const y = 100 - (t.count / maxVal) * 80;
                            return (
                              <circle
                                key={idx}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="#fff"
                                stroke="#4f46e5"
                                strokeWidth="2.5"
                              />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                )}
                {/* X Axis labels */}
                <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-2">
                  {sortedTrend.map(t => (
                    <span key={t.date}>{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
      
      {/* -------------------- MODALS & DRAWERS -------------------- */}
      
      {/* Schedule Interview Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">Schedule New Interview</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Shortlisted Candidate Application</label>
                <select 
                  onChange={(e) => handleAppSelectForSchedule(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1 bg-slate-50"
                >
                  <option value="">-- Choose Candidate --</option>
                  {applications
                    .filter(app => !['Rejected', 'Joined', 'Offer Released'].includes(app.stage))
                    .map(app => (
                      <option key={app._id} value={app._id}>
                        {app.studentId?.userId?.name || 'Unknown'} - {app.jobId?.title} (Assessment Score: {app.assessmentScore || app.assessmentResult?.score || 0}%)
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interview Type</label>
                  <select 
                    value={scheduleForm.interviewType}
                    onChange={(e) => setScheduleForm({...scheduleForm, interviewType: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1 bg-slate-50"
                  >
                    <option value="Technical">Technical</option>
                    <option value="HR">HR</option>
                    <option value="Managerial">Managerial</option>
                    <option value="Panel">Panel</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interview Round Name</label>
                  <input 
                    type="text"
                    required
                    value={scheduleForm.interviewRound}
                    onChange={(e) => setScheduleForm({...scheduleForm, interviewRound: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date</label>
                  <input 
                    type="date"
                    required
                    value={scheduleForm.interviewDate}
                    onChange={(e) => setScheduleForm({...scheduleForm, interviewDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Start Time</label>
                  <input 
                    type="time"
                    required
                    value={scheduleForm.interviewTime}
                    onChange={(e) => setScheduleForm({...scheduleForm, interviewTime: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duration (Mins)</label>
                  <input 
                    type="number"
                    required
                    value={scheduleForm.duration}
                    onChange={(e) => setScheduleForm({...scheduleForm, duration: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mode</label>
                  <select 
                    value={scheduleForm.interviewMode}
                    onChange={(e) => setScheduleForm({...scheduleForm, interviewMode: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1 bg-slate-50"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                {scheduleForm.interviewMode === 'Online' ? (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meeting Platform</label>
                    <select 
                      value={scheduleForm.meetingPlatform}
                      onChange={(e) => setScheduleForm({...scheduleForm, meetingPlatform: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1 bg-slate-50"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="MS Teams">MS Teams</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Venue Name</label>
                    <input 
                      type="text"
                      required
                      value={scheduleForm.venue}
                      onChange={(e) => setScheduleForm({...scheduleForm, venue: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>
                )}
              </div>
              
              {scheduleForm.interviewMode === 'Online' ? (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meeting Link</label>
                  <input 
                    type="url"
                    placeholder="https://..."
                    value={scheduleForm.meetingLink}
                    onChange={(e) => setScheduleForm({...scheduleForm, meetingLink: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Venue Address</label>
                  <input 
                    type="text"
                    required
                    value={scheduleForm.venueAddress}
                    onChange={(e) => setScheduleForm({...scheduleForm, venueAddress: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interviewer Name</label>
                  <input 
                    type="text"
                    required
                    value={scheduleForm.interviewerName}
                    onChange={(e) => setScheduleForm({...scheduleForm, interviewerName: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interviewer Email</label>
                  <input 
                    type="email"
                    required
                    value={scheduleForm.interviewerEmail}
                    onChange={(e) => setScheduleForm({...scheduleForm, interviewerEmail: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Designation</label>
                  <input 
                    type="text"
                    value={scheduleForm.interviewerDesignation}
                    onChange={(e) => setScheduleForm({...scheduleForm, interviewerDesignation: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interview Instructions</label>
                <textarea 
                  rows="2"
                  value={scheduleForm.interviewInstructions}
                  onChange={(e) => setScheduleForm({...scheduleForm, interviewInstructions: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 mt-1"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    // Force Draft state and submit
                    const draftPayload = { ...scheduleForm, status: 'Draft' };
                    try {
                      const res = await fetch('/api/company/interviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(draftPayload)
                      });
                      const data = await res.json();
                      if (data.success) {
                        setIsScheduleModalOpen(false);
                        fetchInitialData();
                      } else {
                        alert(data.message || 'Failed to save draft');
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-xl"
                >
                  💾 Save as Draft
                </button>
                <button 
                  type="submit"
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/10"
                >
                  🚀 Schedule Official
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">Reschedule Interview</h2>
              <button onClick={() => setIsRescheduleModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">New Date</label>
                  <input 
                    type="date"
                    required
                    value={rescheduleForm.interviewDate}
                    onChange={(e) => setRescheduleForm({...rescheduleForm, interviewDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">New Time</label>
                  <input 
                    type="time"
                    required
                    value={rescheduleForm.interviewTime}
                    onChange={(e) => setRescheduleForm({...rescheduleForm, interviewTime: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rescheduling Remarks / Reason</label>
                <textarea 
                  rows="3"
                  required
                  placeholder="Reason for reschedule..."
                  value={rescheduleForm.remarks}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, remarks: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 mt-1"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 px-4 py-2"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl shadow-md shadow-indigo-600/10"
                >
                  Apply Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">Cancel Interview</h2>
              <button onClick={() => setIsCancelModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cancellation Remarks / Reason</label>
                <textarea 
                  rows="3"
                  required
                  placeholder="Type the cancellation details to notify candidate..."
                  value={cancelRemarks}
                  onChange={(e) => setCancelRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 mt-1"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 px-4 py-2"
                >
                  Go Back
                </button>
                <button 
                  type="submit"
                  className="text-xs font-bold bg-rose-600 hover:bg-rose-750 text-white px-5 py-2 rounded-xl shadow-md shadow-rose-600/10"
                >
                  Cancel Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Evaluation Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">Submit Evaluation Feedback</h2>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              
              {/* Sliders Grid */}
              <div className="space-y-3.5 border-b border-slate-100 pb-4">
                {[
                  { label: 'Communication (10 Marks)', key: 'communication' },
                  { label: 'Technical Knowledge (10 Marks)', key: 'technicalKnowledge' },
                  { label: 'Problem Solving (10 Marks)', key: 'problemSolving' },
                  { label: 'Confidence (10 Marks)', key: 'confidence' },
                  { label: 'Professionalism (10 Marks)', key: 'professionalism' }
                ].map(item => (
                  <div key={item.key} className="flex justify-between items-center gap-4">
                    <span className="w-48 font-bold text-slate-700">{item.label}</span>
                    <input 
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={feedbackForm[item.key]}
                      onChange={(e) => setFeedbackForm({...feedbackForm, [item.key]: Number(e.target.value)})}
                      className="flex-1 accent-indigo-600 cursor-pointer"
                    />
                    <span className="w-8 font-extrabold text-right text-slate-800 text-sm">{feedbackForm[item.key]}/10</span>
                  </div>
                ))}
                
                {/* Auto Calculated Sum */}
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
                  <span className="font-bold text-slate-600">Total Calculated Score</span>
                  <span className="text-base font-black text-indigo-600">{currentCalculatedScore} / 50</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Strengths</label>
                  <textarea 
                    rows="2.5"
                    required
                    value={feedbackForm.strengths}
                    onChange={(e) => setFeedbackForm({...feedbackForm, strengths: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Weaknesses</label>
                  <textarea 
                    rows="2.5"
                    required
                    value={feedbackForm.weaknesses}
                    onChange={(e) => setFeedbackForm({...feedbackForm, weaknesses: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">HR Remarks / Feedback Summary</label>
                <textarea 
                  rows="2"
                  value={feedbackForm.hrRemarks}
                  onChange={(e) => setFeedbackForm({...feedbackForm, hrRemarks: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Evaluation Status</label>
                  <select 
                    value={feedbackForm.status}
                    onChange={(e) => setFeedbackForm({...feedbackForm, status: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold mt-1 bg-slate-50"
                  >
                    <option value="Completed">Completed Only</option>
                    <option value="Selected">Mark Selected</option>
                    <option value="Rejected">Mark Rejected</option>
                    <option value="Hold">Mark Hold</option>
                  </select>
                </div>
                <div className="flex gap-2.5 items-end justify-end">
                  <button 
                    type="button"
                    onClick={() => setIsFeedbackModalOpen(false)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl shadow-md shadow-teal-600/10"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Side Drawer */}
      {isDrawerOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Drawer backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          {/* Slider Drawer container */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 transition-transform duration-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Interview Session Info</h3>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider">{selectedInterview.interviewId}</span>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin text-xs font-semibold text-slate-600">
              
              {/* Score breakdown metrics widget */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Recruitment Score Aggregation</span>
                <div className="grid grid-cols-3 gap-2 text-center mt-2">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                    <div className="text-[9px] text-slate-400 font-bold">Assessment</div>
                    <div className="text-sm font-extrabold text-slate-800 mt-1">
                      {selectedInterview.assessmentResultId?.score || selectedInterview.feedback?.assessmentScore || 0}%
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                    <div className="text-[9px] text-slate-400 font-bold">Technical</div>
                    <div className="text-sm font-extrabold text-slate-800 mt-1">
                      {selectedInterview.technicalAttemptId?.scores?.totalScore || selectedInterview.feedback?.technicalScore || 0}/20
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                    <div className="text-[9px] text-slate-400 font-bold">Interview</div>
                    <div className="text-sm font-extrabold text-slate-800 mt-1">
                      {selectedInterview.feedback?.totalScore || 0}/50
                    </div>
                  </div>
                </div>
                
                {/* Overall Score */}
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-150 shadow-sm mt-3">
                  <span className="font-bold text-slate-600">Overall Score Percentage</span>
                  <span className="font-black text-indigo-600 text-sm">
                    {selectedInterview.feedback?.totalScore 
                      ? `${Math.round(((Number(selectedInterview.assessmentResultId?.score || 0) + Number(selectedInterview.technicalAttemptId?.scores?.totalScore || 0) + Number(selectedInterview.feedback?.totalScore || 0)) / 170) * 10000) / 100}%` 
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Status details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Candidate Name</h4>
                  <p className="text-slate-800 font-bold text-sm mt-1">{selectedInterview.candidateId?.name || selectedInterview.studentId?.userId?.name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Status Badge</h4>
                  <div className="mt-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(selectedInterview.status)}`}>
                      {selectedInterview.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Job Role</h4>
                  <p className="text-slate-700 font-semibold mt-1">{selectedInterview.jobId?.title || selectedInterview.driveId?.jobRole || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Confirmation</h4>
                  <p className="text-slate-700 font-semibold mt-1">{selectedInterview.confirmationStatus}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Schedule Time</h4>
                  <p className="text-slate-700 font-semibold mt-1">
                    {new Date(selectedInterview.interviewDate).toLocaleDateString('en-IN')} | {selectedInterview.interviewTime}
                  </p>
                </div>
                <div>
                  <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Duration</h4>
                  <p className="text-slate-700 font-semibold mt-1">{selectedInterview.duration} mins ({selectedInterview.timezone})</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Interviewer Profile</h4>
                <p className="text-slate-700 font-semibold mt-1">{selectedInterview.interviewerName} ({selectedInterview.interviewerEmail})</p>
                {selectedInterview.interviewerDesignation && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{selectedInterview.interviewerDesignation}</p>}
              </div>

              {/* Decline Reason / Notes if present */}
              {selectedInterview.confirmationStatus === 'Declined' && selectedInterview.candidateDeclineReason && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl mt-3 text-red-800 text-xs">
                  <strong className="font-bold">Decline Reason:</strong> {selectedInterview.candidateDeclineReason}
                </div>
              )}
              {selectedInterview.confirmationStatus === 'Reschedule Requested' && selectedInterview.candidateRescheduleNotes && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl mt-3 text-amber-800 text-xs">
                  <strong className="font-bold">Reschedule Requested Notes:</strong> {selectedInterview.candidateRescheduleNotes}
                </div>
              )}

              {/* Vertical Timeline log */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Execution Timeline History</h4>
                <div className="relative pl-5 border-l-2 border-slate-100 space-y-4 mt-2">
                  {selectedInterview.timeline?.map((item, index) => (
                    <div key={index} className="relative">
                      {/* circle node */}
                      <div className="absolute -left-[27px] top-1.5 w-3 h-3 bg-indigo-600 border-2 border-white rounded-full" />
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 text-xs">{item.status}</span>
                          <span className="text-[9px] text-slate-400 font-medium">{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Actor: {item.actorRole}</p>
                        {item.remarks && <p className="text-[10px] text-slate-500 font-medium mt-1 italic">"{item.remarks}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Panel */}
              {['Scheduled', 'Rescheduled', 'Completed', 'Hold'].includes(selectedInterview.status) && (
                <div className="border-t border-slate-100 pt-4 space-y-2 bg-slate-50 p-4 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Quick Outcome Actions</span>
                  <div className="flex gap-2.5 mt-2">
                    <button 
                      onClick={() => handleDecisionAction('Selected')}
                      className="flex-1 text-[10px] font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg"
                    >
                      Selected
                    </button>
                    <button 
                      onClick={() => handleDecisionAction('Rejected')}
                      className="flex-1 text-[10px] font-bold uppercase bg-red-600 hover:bg-red-750 text-white py-2 rounded-lg"
                    >
                      Rejected
                    </button>
                    <button 
                      onClick={() => handleDecisionAction('Hold')}
                      className="flex-1 text-[10px] font-bold uppercase bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg"
                    >
                      Hold
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
