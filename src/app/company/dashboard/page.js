'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyDashboard() {
  const router = useRouter();
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [interviewData, setInterviewData] = useState({
    type: 'HR Interview',
    mode: 'Online',
    date: '',
    startTime: '',
    endTime: '',
    type: 'HR Interview',
    mode: 'Online',
    date: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    venue: '',
    interviewerName: ''
  });

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerData, setOfferData] = useState({
    jobRole: '',
    salaryPackage: '',
    location: '',
    joiningDate: '',
    expiryDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real app, you would have an API specifically returning the Company's drives and apps.
      // We will assume `/api/company/dashboard` returns `{ drives: [], applications: [] }`
      const res = await fetch('/api/company/dashboard');
      if (res.status === 401) {
        router.push('/company/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDrives(data.drives);
        setApplications(data.applications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      const res = await fetch('/api/applications/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleScheduleInterviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/company/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp._id,
          ...interviewData
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchDashboardData();
        alert('Interview scheduled successfully');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Failed to schedule interview');
    }
  };

  const handleGenerateOfferSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/company/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp._id,
          ...offerData
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowOfferModal(false);
        fetchDashboardData();
        alert('Offer generated successfully');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Failed to generate offer');
    }
  };

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/';
    router.push('/company/login');
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Company Dashboard</h1>
        <div className="space-x-4">
          <a href="/company/interviews" className="text-sm font-medium text-slate-300 hover:text-white">Interviews</a>
          <a href="/company/offers" className="text-sm font-medium text-slate-300 hover:text-white">Offers</a>
          <button onClick={handleLogout} className="text-sm font-medium text-rose-400 hover:text-rose-300 ml-4 border-l border-slate-700 pl-4">Logout</button>
        </div>
      </header>
      
      <main className="p-6 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Drives Overview */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Your Recruitment Drives</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drives.map(drive => (
              <div key={drive._id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg text-slate-800">{drive.jobRole}</h3>
                <p className="text-xs text-slate-500 mb-2">{drive.jobDescription}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                    {drive.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {applications.filter(a => a.driveId === drive._id).length} Applicants
                  </span>
                </div>
              </div>
            ))}
            {drives.length === 0 && (
              <div className="col-span-3 py-8 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                No recruitment drives assigned to your company yet.
              </div>
            )}
          </div>
        </div>

        {/* Application Pipeline */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Application Pipeline (Verified Candidates)</h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="p-4 font-bold">Candidate</th>
                  <th className="p-4 font-bold">College</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(app => (
                  <tr key={app._id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{app.studentId?.name || 'Candidate'}</div>
                      <div className="text-xs text-slate-500">{app.studentId?.email || 'N/A'}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{app.collegeName}</td>
                    <td className="p-4 text-sm font-semibold text-indigo-600">
                      {drives.find(d => d._id === app.driveId)?.jobRole || 'Unknown Role'}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {app.status === 'Admin Verified' && (
                        <button onClick={() => handleStatusUpdate(app._id, 'Company Shortlisted')} className="text-xs font-bold text-indigo-600">Shortlist</button>
                      )}
                      {app.status === 'Company Shortlisted' && (
                        <button onClick={() => { setSelectedApp(app); setShowModal(true); }} className="text-xs font-bold text-amber-600">Schedule Interview</button>
                      )}
                      {app.status === 'Interview Scheduled' && (
                        <button onClick={() => handleStatusUpdate(app._id, 'Interview Completed')} className="text-xs font-bold text-blue-600">Mark Completed</button>
                      )}
                      {app.status === 'Interview Completed' && (
                        <>
                          <button onClick={() => { setSelectedApp(app); setOfferData(prev => ({...prev, jobRole: drives.find(d => d._id === app.driveId)?.jobRole || ''})); setShowOfferModal(true); }} className="text-xs font-bold text-emerald-600">Select & Generate Offer</button>
                          <button onClick={() => handleStatusUpdate(app._id, 'Rejected')} className="text-xs font-bold text-rose-600">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No verified applications to review yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Schedule Interview Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Schedule Interview for {selectedApp?.studentId?.name}</h3>
              <form onSubmit={handleScheduleInterviewSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                    <select required value={interviewData.type} onChange={e => setInterviewData({...interviewData, type: e.target.value})} className="w-full p-2 border rounded">
                      <option>HR Interview</option>
                      <option>Technical Interview</option>
                      <option>Aptitude Test</option>
                      <option>Group Discussion</option>
                      <option>Final Interview</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mode</label>
                    <select required value={interviewData.mode} onChange={e => setInterviewData({...interviewData, mode: e.target.value})} className="w-full p-2 border rounded">
                      <option>Online</option>
                      <option>Offline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                    <input required type="date" value={interviewData.date} onChange={e => setInterviewData({...interviewData, date: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Start</label>
                      <input required type="time" value={interviewData.startTime} onChange={e => setInterviewData({...interviewData, startTime: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">End</label>
                      <input required type="time" value={interviewData.endTime} onChange={e => setInterviewData({...interviewData, endTime: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">{interviewData.mode === 'Online' ? 'Meeting Link' : 'Venue'}</label>
                    <input required type="text" value={interviewData.mode === 'Online' ? interviewData.meetingLink : interviewData.venue} onChange={e => interviewData.mode === 'Online' ? setInterviewData({...interviewData, meetingLink: e.target.value}) : setInterviewData({...interviewData, venue: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Interviewer Name</label>
                    <input required type="text" value={interviewData.interviewerName} onChange={e => setInterviewData({...interviewData, interviewerName: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded">Schedule</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Generate Offer Modal */}
        {showOfferModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Generate Offer for {selectedApp?.studentId?.name}</h3>
              <form onSubmit={handleGenerateOfferSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Job Role</label>
                    <input required type="text" value={offerData.jobRole} onChange={e => setOfferData({...offerData, jobRole: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Salary Package</label>
                    <input required type="text" value={offerData.salaryPackage} onChange={e => setOfferData({...offerData, salaryPackage: e.target.value})} placeholder="e.g. 5 LPA" className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Work Location</label>
                    <input required type="text" value={offerData.location} onChange={e => setOfferData({...offerData, location: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Joining Date</label>
                    <input required type="date" value={offerData.joiningDate} onChange={e => setOfferData({...offerData, joiningDate: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Offer Expiry Date</label>
                    <input required type="date" value={offerData.expiryDate} onChange={e => setOfferData({...offerData, expiryDate: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Additional Notes</label>
                    <textarea value={offerData.notes} onChange={e => setOfferData({...offerData, notes: e.target.value})} className="w-full p-2 border rounded" rows="2"></textarea>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button type="button" onClick={() => setShowOfferModal(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded">Generate & Release Offer</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
