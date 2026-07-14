'use client';

import { useState, useEffect } from 'react';

const defaultEmailForm = {
  interviewRound: 'Technical Round 1',
  interviewType: '',
  interviewMode: '',
  interviewDate: '',
  interviewTime: '',
  duration: '30 Minutes',
  meetingLink: '',
  venue: '',
  interviewerName: '',
  interviewerEmail: '',
  contactNumber: '',
  responseDeadline: '',
  emailSubject: '',
  emailContent: '',
  sendCopyToHR: false,
  highPriority: false,
};

const generateEmailContent = (candidateName, role, mode = 'create') => {
  if (mode === 'resend') {
    return `Dear ${candidateName},

Congratulations!

You have been shortlisted to attend the HR Interview for the position of ${role} through Virudhunagar Employment Connect.

Please find your interview details below. Kindly attend the HR Interview Round and join the interview 10 minutes before the scheduled time.

If the interview is conducted online, please use the meeting link provided below.
If the interview is conducted offline, kindly arrive at the interview venue on time with all the required documents.

Please ensure that you attend the HR Interview as scheduled. Successful completion of this round will move you forward in the recruitment process.

If you are selected in the HR Interview Round, your Offer Letter will be made available in your Candidate Portal under the "My Offers" section on the Virudhunagar Employment Connect website. You can log in to your account to view and download your offer letter once it has been released by the employer.

If you have any questions or require any assistance, please feel free to contact us.

We wish you all the very best for your HR Interview!

Best Regards,
Virudhunagar Employment Connect
HR Team`;
  }

  return `Dear ${candidateName},

Congratulations!

You have been shortlisted to attend the Technical Round for the position of ${role} through Virudhunagar Employment Connect.

Please find your interview details below. Kindly attend the Technical Round and join the interview 10 minutes before the scheduled time.

If the interview is conducted online, please use the meeting link provided below. If it is an offline interview, kindly arrive at the venue on time with the required documents.

Please ensure you attend the Technical Round as scheduled. Successful completion of this round will move you forward in the recruitment process.

If you have any questions or require any assistance, please feel free to contact us.

We wish you all the best for your Technical Round!

Best Regards,
Virudhunagar Employment Connect
HR Team`;
};

export default function InterviewEmailModal({
  isOpen,
  onClose,
  mode = 'create', // 'create' or 'resend'
  
  // Create mode props
  jobRole = '',
  jobId = null,
  candidates = [],
  loadingCandidates = false,
  
  // Resend mode props
  existingInterview = null,

  // Callbacks
  onSuccess,
}) {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);

  const [emailForm, setEmailForm] = useState(defaultEmailForm);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'resend' && existingInterview) {
        // Map existing interview fields
        const candidateName = existingInterview.candidateId?.name || existingInterview.studentId?.userId?.name || 'Candidate';
        const candidateEmail = existingInterview.candidateId?.email || existingInterview.studentId?.userId?.email || '';
        const role = existingInterview.jobId?.title || existingInterview.driveId?.jobRole || 'Position';
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedCandidate({
          _id: existingInterview.applicationId?._id || existingInterview.applicationId,
          studentId: {
            userId: {
              _id: existingInterview.candidateId?._id || existingInterview.studentId?.userId?._id,
              name: candidateName,
              email: candidateEmail,
            }
          },
          companyId: { companyName: existingInterview.companyId?.companyName },
          stage: existingInterview.status,
          assessmentResult: { percentage: existingInterview.assessmentScore }
        });

        // format date for input[type="date"]
        let formattedDate = '';
        if (existingInterview.interviewDate) {
          const d = new Date(existingInterview.interviewDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0];
          }
        }

        setEmailForm({
          ...defaultEmailForm,
          interviewRound: existingInterview.interviewRound || 'Technical Round 1',
          interviewType: existingInterview.interviewType || '',
          interviewMode: existingInterview.interviewMode || '',
          interviewDate: formattedDate,
          interviewTime: existingInterview.interviewTime || '',
          duration: (existingInterview.duration ? `${existingInterview.duration} Minutes` : '30 Minutes'),
          meetingLink: existingInterview.meetingLink || '',
          venue: existingInterview.venueAddress || existingInterview.venue || '',
          interviewerName: existingInterview.interviewerName || '',
          interviewerEmail: existingInterview.interviewerEmail || '',
          contactNumber: existingInterview.contactNumber || '',
          emailSubject: `HR Interview Invitation – ${role} | Virudhunagar Employment Connect`,
          emailContent: generateEmailContent(candidateName, role, 'resend'),
        });
      } else {
        // Create mode init
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedCandidate(null);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAttachmentFile(null);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmailForm({
          ...defaultEmailForm,
          emailSubject: `Technical Round Interview Invitation – ${jobRole || 'Position'} | Virudhunagar Employment Connect`,
        });
      }
    }
  }, [isOpen, mode, existingInterview, jobRole]);

  if (!isOpen) return null;

  // Select Candidate for Create Mode
  const handleCandidateSelect = (appId) => {
    const app = candidates.find(c => c._id === appId);
    setSelectedCandidate(app || null);
    if (app) {
      const candidateName = app.studentId?.userId?.name || 'Candidate';
      const role = jobRole || 'Position';
      setEmailForm(prev => ({
        ...prev,
        emailSubject: `Technical Round Interview Invitation – ${role} | Virudhunagar Employment Connect`,
        emailContent: generateEmailContent(candidateName, role),
      }));
    } else {
      setEmailForm(prev => ({
        ...prev,
        emailSubject: `Technical Round Interview Invitation – ${jobRole || 'Position'} | Virudhunagar Employment Connect`,
        emailContent: '',
      }));
    }
  };



  // Handle Attachment
  const handleAttachment = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Only PDF and DOCX files are allowed', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10 MB', 'error');
      e.target.value = '';
      return;
    }
    setAttachmentFile(file);
  };

  // Validate Form
  const validateForm = () => {
    const errs = [];
    if (!selectedCandidate) errs.push('Please select a candidate');
    if (!emailForm.interviewType) errs.push('Interview Type is required');
    if (!emailForm.interviewMode) errs.push('Interview Mode is required');
    if (!emailForm.interviewDate) errs.push('Interview Date is required');
    if (!emailForm.interviewTime) errs.push('Interview Time is required');
    if (!emailForm.emailSubject) errs.push('Email Subject is required');
    if (!emailForm.emailContent) errs.push('Email Message is required');
    
    // In resend mode, these might not be enforced as strictly if they weren't required originally, but let's keep it safe.
    if (!emailForm.interviewerName) errs.push('Interviewer Name is required');

    if (emailForm.interviewMode === 'Online' && !emailForm.meetingLink) {
      errs.push('Meeting Link is required for Online interviews');
    }
    if (emailForm.interviewMode === 'Offline' && !emailForm.venue) {
      errs.push('Venue is required for Offline interviews');
    }

    // Past date check - Only enforce if in create mode, OR if the date was changed.
    // In resend mode, the date might naturally be in the past if they are resending it for some reason?
    // Actually, usually resend is for upcoming. Let's enforce only on create mode to prevent blockages on old interviews.
    if (mode === 'create' && emailForm.interviewDate) {
      const selDate = new Date(emailForm.interviewDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selDate < today) errs.push('Interview Date cannot be in the past');
    }

    // Email format
    const candidateEmail = selectedCandidate?.studentId?.userId?.email;
    if (candidateEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
      errs.push('Invalid candidate email format');
    }

    return errs;
  };

  // Send Email
  const handleSendInterviewEmail = async () => {
    const errs = validateForm();
    if (errs.length > 0) {
      showToast(errs[0], 'error');
      return;
    }

    setSendingEmail(true);

    try {
      // Read attachment as base64 if present
      let attachment = null;
      if (attachmentFile) {
        const buffer = await attachmentFile.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        attachment = {
          filename: attachmentFile.name,
          data: base64,
          contentType: attachmentFile.type,
        };
      }

      let res;
      if (mode === 'create') {
        const payload = {
          candidateId: selectedCandidate?.studentId?.userId?._id || selectedCandidate?.studentId?.userId,
          jobId: jobId?._id || jobId,
          applicationId: selectedCandidate?._id,
          interviewRound: emailForm.interviewRound,
          candidateName: selectedCandidate?.studentId?.userId?.name || 'Candidate',
          candidateEmail: selectedCandidate?.studentId?.userId?.email,
          jobTitle: jobRole,
          interviewType: emailForm.interviewType,
          interviewMode: emailForm.interviewMode,
          interviewDate: emailForm.interviewDate,
          interviewTime: emailForm.interviewTime,
          duration: emailForm.duration,
          meetingLink: emailForm.meetingLink,
          venue: emailForm.venue,
          interviewerName: emailForm.interviewerName,
          interviewerEmail: emailForm.interviewerEmail,
          contactNumber: emailForm.contactNumber,
          responseDeadline: emailForm.responseDeadline,
          emailSubject: emailForm.emailSubject,
          emailContent: emailForm.emailContent,
          sendCopyToHR: emailForm.sendCopyToHR,
          highPriority: emailForm.highPriority,
          attachment,
        };

        res = await fetch('/api/company/technical-tests/send-interview-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Resend mode
        const payload = {
          emailSubject: emailForm.emailSubject,
          emailContent: emailForm.emailContent,
          sendCopyToHR: emailForm.sendCopyToHR,
          highPriority: emailForm.highPriority,
          
          // Extracted for template building on backend
          candidateName: selectedCandidate?.studentId?.userId?.name || 'Candidate',
          candidateEmail: selectedCandidate?.studentId?.userId?.email,
          jobTitle: jobRole || existingInterview?.jobId?.title || existingInterview?.driveId?.jobRole,
          interviewType: emailForm.interviewType,
          interviewDate: emailForm.interviewDate,
          interviewTime: emailForm.interviewTime,
          duration: emailForm.duration,
          interviewMode: emailForm.interviewMode,
          meetingLink: emailForm.meetingLink,
          venue: emailForm.venue,
          interviewerName: emailForm.interviewerName,
          interviewerEmail: emailForm.interviewerEmail,
          contactNumber: emailForm.contactNumber,
          responseDeadline: emailForm.responseDeadline
        };

        res = await fetch(`/api/company/interviews/${existingInterview._id}/resend-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (data.success) {
        showToast('Interview invitation email sent successfully!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(data.message || 'Failed to send email', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const inputCls = "w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-medium bg-white transition-colors disabled:bg-slate-100 disabled:text-slate-500";
  const labelCls = "text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-3.5 rounded-xl font-bold shadow-2xl text-white text-sm transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.type === 'error' ? '✕ ' : '✓ '}{toast.message}
        </div>
      )}

      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0B1E40] to-[#1e3a5f] px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Interview Invitation {mode === 'resend' ? '(Resend)' : ''}</h2>
            <p className="text-slate-300 text-xs mt-0.5">{jobRole || 'Position'}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white text-2xl leading-none transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* ===== SECTION 1: Candidate Selection ===== */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-black">1</span>
              Candidate Details
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              {mode === 'create' ? (
                <div className="mb-3">
                  <label className={labelCls}>Select Candidate *</label>
                  {loadingCandidates ? (
                    <div className="text-xs text-slate-400 py-2">Loading candidates...</div>
                  ) : candidates.filter(c => c.stage === 'Shortlisted for next round').length === 0 ? (
                    <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No candidates found in "Shortlisted for next round" stage.</div>
                  ) : (
                    <select
                      value={selectedCandidate?._id || ''}
                      onChange={(e) => handleCandidateSelect(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">-- Choose a Candidate --</option>
                      {candidates.filter(c => c.stage === 'Shortlisted for next round').map(app => (
                        <option key={app._id} value={app._id}>
                          {app.studentId?.userId?.name || 'Unknown'} – {app.studentId?.userId?.email || 'No email'} ({app.stage})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : null}

              {selectedCandidate && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {[
                    { label: 'Candidate Name', value: selectedCandidate.studentId?.userId?.name || 'N/A' },
                    { label: 'Candidate Email', value: selectedCandidate.studentId?.userId?.email || 'N/A' },
                    { label: 'Applied Job', value: jobRole || 'N/A' },
                    { label: 'Company Name', value: selectedCandidate.companyId?.companyName || 'N/A' },
                    { label: 'Assessment Score', value: selectedCandidate.assessmentResult?.percentage ? `${selectedCandidate.assessmentResult.percentage}%` : (selectedCandidate.assessmentResult?.percentage === 0 ? '0%' : (selectedCandidate.assessmentResult?.percentage || 'N/A')) },
                    { label: 'Current Stage', value: selectedCandidate.stage || 'N/A' },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-lg border border-slate-100 px-3 py-2">
                      <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{item.label}</div>
                      <div className="text-xs font-bold text-slate-700 mt-0.5 truncate" title={item.value}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ===== SECTION 2: Interview Details ===== */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-black">2</span>
              Interview Details
              {mode === 'resend' && <span className="ml-2 text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Read Only</span>}
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Interview Type *</label>
                  <select disabled={mode === 'resend'} value={emailForm.interviewType} onChange={e => setEmailForm(p => ({...p, interviewType: e.target.value}))} className={inputCls}>
                    <option value="">-- Select --</option>
                    <option>Technical Round</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Interview Mode *</label>
                  <select disabled={mode === 'resend'} value={emailForm.interviewMode} onChange={e => setEmailForm(p => ({...p, interviewMode: e.target.value, meetingLink: '', venue: ''}))} className={inputCls}>
                    <option value="">-- Select --</option>
                    <option>Online</option>
                    <option>Offline</option>
                    <option>Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Interview Date *</label>
                  <input disabled={mode === 'resend'} type="date" value={emailForm.interviewDate} onChange={e => setEmailForm(p => ({...p, interviewDate: e.target.value}))} className={inputCls} min={mode === 'create' ? new Date().toISOString().split('T')[0] : undefined} />
                </div>
                <div>
                  <label className={labelCls}>Interview Time *</label>
                  <input disabled={mode === 'resend'} type="text" placeholder="e.g. 10:30 AM" value={emailForm.interviewTime} onChange={e => setEmailForm(p => ({...p, interviewTime: e.target.value}))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Duration</label>
                  <select disabled={mode === 'resend'} value={emailForm.duration} onChange={e => setEmailForm(p => ({...p, duration: e.target.value}))} className={inputCls}>
                    <option>15 Minutes</option>
                    <option>30 Minutes</option>
                    <option>45 Minutes</option>
                    <option>60 Minutes</option>
                    <option>90 Minutes</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Response Deadline</label>
                  <input disabled={mode === 'resend'} type="date" value={emailForm.responseDeadline} onChange={e => setEmailForm(p => ({...p, responseDeadline: e.target.value}))} className={inputCls} min={mode === 'create' ? new Date().toISOString().split('T')[0] : undefined} />
                </div>
              </div>

              {/* Conditional: Meeting Link / Venue */}
              {(emailForm.interviewMode === 'Online' || emailForm.interviewMode === 'Hybrid') && (
                <div>
                  <label className={labelCls}>Meeting Link {emailForm.interviewMode === 'Online' ? '*' : ''}</label>
                  <input disabled={mode === 'resend'} type="url" placeholder="https://meet.google.com/..." value={emailForm.meetingLink} onChange={e => setEmailForm(p => ({...p, meetingLink: e.target.value}))} className={inputCls} />
                </div>
              )}
              {(emailForm.interviewMode === 'Offline' || emailForm.interviewMode === 'Hybrid') && (
                <div>
                  <label className={labelCls}>Interview Venue {emailForm.interviewMode === 'Offline' ? '*' : ''}</label>
                  <input disabled={mode === 'resend'} type="text" placeholder="Office address or room number..." value={emailForm.venue} onChange={e => setEmailForm(p => ({...p, venue: e.target.value}))} className={inputCls} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Interviewer Name *</label>
                  <input disabled={mode === 'resend'} type="text" placeholder="Full name" value={emailForm.interviewerName} onChange={e => setEmailForm(p => ({...p, interviewerName: e.target.value}))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Interviewer Email</label>
                  <input disabled={mode === 'resend'} type="email" placeholder="interviewer@company.com" value={emailForm.interviewerEmail} onChange={e => setEmailForm(p => ({...p, interviewerEmail: e.target.value}))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Contact Number</label>
                  <input disabled={mode === 'resend'} type="tel" placeholder="+91 98765 43210" value={emailForm.contactNumber} onChange={e => setEmailForm(p => ({...p, contactNumber: e.target.value}))} className={inputCls} />
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 3: Email Details ===== */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-black">3</span>
              Email Details
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div>
                <label className={labelCls}>Email Subject *</label>
                <input type="text" value={emailForm.emailSubject} onChange={e => setEmailForm(p => ({...p, emailSubject: e.target.value}))} className={inputCls} placeholder="Interview Invitation – Position" />
              </div>
              <div>
                <label className={labelCls}>Email Message *</label>
                <textarea
                  rows={8}
                  value={emailForm.emailContent}
                  onChange={e => setEmailForm(p => ({...p, emailContent: e.target.value}))}
                  className={`${inputCls} resize-y`}
                  placeholder="Write your message here... The interview details table will be automatically included in the email."
                />
                <p className="text-[10px] text-slate-400 mt-1">The interview details table, instructions, and contact info are automatically added to the email.</p>
              </div>
            </div>
          </div>

          {/* ===== SECTION 4: Optional ===== */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-black">4</span>
              Optional
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              {mode === 'create' && (
                <div>
                  <label className={labelCls}>Attachment (PDF / DOCX, Max 10 MB)</label>
                  <input type="file" accept=".pdf,.docx" onChange={handleAttachment} className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                  {attachmentFile && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold">{attachmentFile.name}</span>
                      <button onClick={() => setAttachmentFile(null)} className="text-red-500 hover:text-red-700 font-bold text-xs">✕ Remove</button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={emailForm.sendCopyToHR} onChange={e => setEmailForm(p => ({...p, sendCopyToHR: e.target.checked}))} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">Send Copy to HR</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={emailForm.highPriority} onChange={e => setEmailForm(p => ({...p, highPriority: e.target.checked}))} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">High Priority</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendInterviewEmail}
            disabled={sendingEmail}
            className="px-6 py-2.5 bg-[#0B1E40] hover:bg-[#152d54] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sendingEmail ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              'Send Email'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
