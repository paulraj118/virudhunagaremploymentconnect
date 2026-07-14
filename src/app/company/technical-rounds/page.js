'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InterviewEmailModal from '@/components/company/InterviewEmailModal';

export default function TechnicalRoundsPage() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailModalTest, setEmailModalTest] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await fetch(`/api/company/technical-tests${params}`);
      const data = await res.json();
      if (data.success) {
        setTests(data.data?.tests || []);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch technical tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);


  const handleDelete = async (testId) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/company/technical-tests/${testId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTests(prev => prev.filter(t => t._id !== testId));
      } else {
        showToast(data.message || 'Failed to delete', 'error');
      }
    } catch (err) {
      showToast('Server error while deleting', 'error');
    }
  };

  const handlePublish = async (testId) => {
    if (!confirm('Publishing this test will make it available for candidate assignment. Continue?')) return;
    try {
      const res = await fetch(`/api/company/technical-tests/${testId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchTests();
      } else {
        showToast(data.errors ? data.errors.join('\n') : data.message, 'error');
      }
    } catch (err) {
      showToast('Server error while publishing', 'error');
    }
  };

  // Open Email Modal
  const openEmailModal = async (test) => {
    setEmailModalTest(test);
    setIsEmailModalOpen(true);

    // Fetch candidates for this test's job
    const jobId = test.jobId?._id || test.jobId;
    if (jobId) {
      setLoadingCandidates(true);
      try {
        const res = await fetch(`/api/company/applications?jobId=${jobId}`);
        const data = await res.json();
        if (data.success) {
          setCandidates(data.applications || []);
        } else {
          setCandidates([]);
        }
      } catch {
        setCandidates([]);
      } finally {
        setLoadingCandidates(false);
      }
    } else {
      setCandidates([]);
    }
  };



  const statusBadge = (status) => {
    const styles = {
      'Draft': 'bg-amber-50 text-amber-700 border-amber-200',
      'Published': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Archived': 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
        {status}
      </span>
    );
  };

  // Dashboard counters
  const totalTests = tests.length;
  const draftCount = tests.filter(t => t.status === 'Draft').length;
  const publishedCount = tests.filter(t => t.status === 'Published').length;
  const totalAssigned = tests.reduce((sum, t) => sum + (t.assignedCandidateCount || 0), 0);
  const totalCompleted = tests.reduce((sum, t) => sum + (t.completedCandidateCount || 0), 0);

  // Input style helper
  const inputCls = "w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-medium bg-white transition-colors";
  const labelCls = "text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-6 py-3.5 rounded-xl font-bold shadow-2xl text-white text-sm transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.type === 'error' ? '✕ ' : '✓ '}{toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Technical Rounds</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Create, manage, and assign technical assessments to candidates</p>
        </div>
        <Link
          href="/company/technical-rounds/create"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
          Create Test
        </Link>
      </div>

      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Tests', value: totalTests, color: 'bg-slate-800', icon: '📋' },
          { label: 'Draft', value: draftCount, color: 'bg-amber-500', icon: '📝' },
          { label: 'Published', value: publishedCount, color: 'bg-emerald-500', icon: '✅' },
          { label: 'Assigned', value: totalAssigned, color: 'bg-indigo-500', icon: '👥' },
          { label: 'Completed', value: totalCompleted, color: 'bg-purple-500', icon: '🏆' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{card.icon}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {['', 'Draft', 'Published', 'Archived'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              filterStatus === status
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Tests List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Technical Tests Yet</h3>
          <p className="text-slate-500 text-sm mb-6">Create your first technical test using AI-powered question generation.</p>
          <Link
            href="/company/technical-rounds/create"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm"
          >
            Create Your First Test
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map(test => (
            <div key={test._id} className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-800 truncate">{test.jobRole}</h3>
                    {statusBadge(test.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {test.duration} mins
                    </span>
                    <span>Total: {test.totalMarks} marks</span>
                    <span>Pass: {test.passingMarks} marks</span>
                    <span className="text-indigo-600 font-bold">{test.assignedCandidateCount || 0} assigned</span>
                    <span className="text-emerald-600 font-bold">{test.completedCandidateCount || 0} completed</span>
                  </div>
                  {test.jobId && (
                    <p className="text-xs text-slate-400 mt-1.5">Job: {test.jobId.title || test.jobId.role || 'N/A'}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => router.push(`/company/technical-rounds/${test._id}`)}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                  >
                    View
                  </button>

                  {test.status === 'Draft' && (
                    <>
                      <button
                        onClick={() => router.push(`/company/technical-rounds/${test._id}/edit`)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handlePublish(test._id)}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => handleDelete(test._id)}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}

                  {test.status === 'Published' && (
                    <>
                      <button
                        onClick={() => router.push(`/company/technical-rounds/${test._id}/assign`)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => router.push(`/company/technical-rounds/${test._id}/results`)}
                        className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition-colors"
                      >
                        Results
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openEmailModal(test)}
                    className="px-3.5 py-2 bg-[#0B1E40] hover:bg-[#152d54] text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <InterviewEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        mode="create"
        jobRole={emailModalTest?.jobRole || emailModalTest?.jobId?.title || ''}
        jobId={emailModalTest?.jobId}
        candidates={candidates}
        loadingCandidates={loadingCandidates}
        onSuccess={fetchTests}
      />
    </div>
  );
}
