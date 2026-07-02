'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function AssignTechnicalTestPage() {
  const { id } = useParams();
  const router = useRouter();
  const [test, setTest] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Test Details
      const testRes = await fetch(`/api/company/technical-tests/${id}`);
      const testData = await testRes.json();
      
      if (!testData.success) {
        setError(testData.message);
        return;
      }
      
      const testDetails = testData.data.test;
      if (testDetails.status !== 'Published') {
        setError('Only Published tests can be assigned. Please publish this test first.');
        return;
      }
      setTest(testDetails);

      // 2. Fetch Job Applications for this Test's Job ID to find candidates
      if (testDetails.jobId) {
        // We use the existing applications API, filtered by jobId
        const appRes = await fetch(`/api/company/applications?jobId=${testDetails.jobId._id || testDetails.jobId}`);
        const appData = await appRes.json();
        
        if (appData.success) {
          // Filter to show only candidates who haven't been assigned a test yet (or have this test assigned but not started)
          // Also only show candidates in 'Applied', 'Assessment Completed', or 'Shortlisted' stages
          const eligibleCandidates = (appData.data?.applications || []).filter(app => {
            const validStage = app.stage === 'Shortlisted';
            const notStarted = app.technicalTestStatus === 'Not Assigned' || app.technicalTestStatus === 'Assigned';
            return validStage && notStarted;
          });
          setCandidates(eligibleCandidates);
          
          // Pre-select candidates who are already assigned to this specific test
          const preSelected = new Set();
          eligibleCandidates.forEach(app => {
            if (app.technicalTestId === testDetails._id && app.technicalTestStatus === 'Assigned') {
              preSelected.add(app._id);
            }
          });
          setSelectedIds(preSelected);
        }
      }
    } catch (err) {
      setError('Server error while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (applicationId) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(applicationId)) {
      newSelection.delete(applicationId);
    } else {
      newSelection.add(applicationId);
    }
    setSelectedIds(newSelection);
  };

  const toggleAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set()); // Deselect all
    } else {
      setSelectedIds(new Set(candidates.map(c => c._id))); // Select all
    }
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one candidate to assign.');
      return;
    }
    
    setAssigning(true);
    setSuccessMsg(null);
    setError(null);

    try {
      const res = await fetch(`/api/company/technical-tests/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: Array.from(selectedIds) })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccessMsg(`Test successfully assigned to ${data.data.assignedCount} candidate(s).`);
        setTimeout(() => router.push(`/company/technical-rounds/${id}`), 2000);
      } else {
        setError(data.errors ? data.errors.join('\n') : data.message);
      }
    } catch (err) {
      setError('Server error while assigning tests.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error && !test) return (
    <div className="bg-red-50 text-red-600 p-8 rounded-2xl text-center max-w-2xl mx-auto mt-10 font-medium border border-red-200">
      {error}
      <button onClick={() => router.push(`/company/technical-rounds/${id}`)} className="block mt-4 text-sm text-red-800 underline mx-auto">Back to Test Details</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Assign Candidates</h1>
          <p className="text-slate-500 text-sm font-medium">Assign test <span className="font-bold text-indigo-600">{test?.jobRole}</span> to applicants of <span className="font-bold text-slate-700">{test?.jobId?.title || 'Job'}</span></p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          {successMsg} Redirecting...
        </div>
      )}

      {/* Candidate List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Eligible Candidates <span className="text-slate-500 font-normal">({candidates.length})</span></h2>
          <div className="text-sm font-medium text-slate-500">
            Selected: <span className="text-indigo-600 font-bold">{selectedIds.size}</span>
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <p className="text-slate-600 font-medium">No eligible candidates found for this job.</p>
            <p className="text-slate-400 text-sm mt-1">Candidates must be in the 'Shortlisted' stage to receive assignments.</p>
          </div>
        ) : (
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3 px-6 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      checked={candidates.length > 0 && selectedIds.size === candidates.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="py-3 px-6">Candidate</th>
                  <th className="py-3 px-6">Current Stage</th>
                  <th className="py-3 px-6">Test Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((app) => {
                  const student = app.studentId || {};
                  const isAssigned = app.technicalTestId === test._id && app.technicalTestStatus === 'Assigned';
                  return (
                    <tr 
                      key={app._id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedIds.has(app._id) ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => toggleSelection(app._id)}
                    >
                      <td className="py-4 px-6 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none"
                          checked={selectedIds.has(app._id)}
                          readOnly
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{student.name || 'Unknown Candidate'}</div>
                        <div className="text-xs text-slate-500">{student.email || student.userId?.email || 'No email'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {app.stage}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Pending
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Not Assigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleAssign}
                disabled={assigning || selectedIds.size === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-8 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
              >
                {assigning ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Assigning...</>
                ) : (
                  <>Assign Test to {selectedIds.size} Candidate(s)</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
