'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StudentApprovals() {
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await fetch('/api/admin/enrollments');
      const data = await res.json();
      if (data.success) {
        setEnrollments(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // const handleAction = async (id, status) => {
  //   if (!confirm(`Are you sure you want to ${status} this student?`)) return;
  //   
  //   setActionLoading(id);
  //   try {
  //     const res = await fetch(`/api/admin/enrollments/${id}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ status })
  //     });
  //     const data = await res.json();
  //     if (data.success) {
  //       // Refresh list
  //       fetchEnrollments();
  //     } else {
  //       alert(data.message);
  //     }
  //   } catch (error) {
  //     alert('Action failed');
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this enrollment permanently?')) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchEnrollments();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  // const handleEdit = async (student) => {
  //   const newCollege = prompt('Enter new college name:', student.collegeName);
  //   if (!newCollege) return;
  //   
  //   setActionLoading(student._id);
  //   try {
  //     const res = await fetch(`/api/admin/enrollments/${student._id}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ collegeName: newCollege })
  //     });
  //     const data = await res.json();
  //     if (data.success) {
  //       fetchEnrollments();
  //     } else {
  //       alert(data.message);
  //     }
  //   } catch (error) {
  //     alert('Edit failed');
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };

  const handleView = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedStudent(data.data);
        setIsModalOpen(true);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Failed to fetch student details');
    } finally {
      setActionLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'Mobile', 'Degree', 'Department', 'College', 'Domain', 'Track', 'Status'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    enrollments.forEach(student => {
      const row = [
        `"${student.userId?.name || ''}"`,
        `"${student.userId?.email || ''}"`,
        `"${student.userId?.mobile || ''}"`,
        `"${student.degree}"`,
        `"${student.department}"`,
        `"${student.collegeName}"`,
        `"${student.preferredDomain}"`,
        `"${student.industryTrack || 'IT'}"`,
        `"${student.enrollmentStatus}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'students_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredEnrollments = enrollments.filter(student => {
    const searchMatch = 
      student.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.collegeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || student.enrollmentStatus === filterStatus;
    return searchMatch && statusMatch;
  });

  if (loading) return <div className="p-8">Loading enrollments...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Student Approvals</h1>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Export CSV
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 hover:scale-[1.02] transition-all duration-300 transform flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] group">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 transition-transform duration-300 group-hover:scale-110 shadow-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Enrollments</div>
              <div className="text-3xl font-black text-blue-600 tracking-tight">{stats.totalEnrollments}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5 hover:scale-[1.02] transition-all duration-300 transform flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] group">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110 shadow-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"></path></svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Active Students</div>
              <div className="text-3xl font-black text-emerald-600 tracking-tight">{stats.activeStudents}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/5 hover:scale-[1.02] transition-all duration-300 transform flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] group">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 transition-transform duration-300 group-hover:scale-110 shadow-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pending Approvals</div>
              <div className="text-3xl font-black text-amber-600 tracking-tight">{stats.pendingApprovals}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input 
          type="text"
          placeholder="Search by name, email or college..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Academic Details</th>
                <th className="px-6 py-4">Preferred Domain</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{student.userId?.name}</div>
                    <div className="text-xs text-slate-500">{student.userId?.email}</div>
                    <div className="text-xs text-slate-500">{student.userId?.mobile}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">{student.degree} in {student.department}</div>
                    <div className="text-xs text-slate-500">{student.collegeName} • Passed Out: {student.yearOfPassedOut} • Exp: {student.yearsOfExperience || 0} yrs</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {student.preferredDomain}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase">
                        {student.industryTrack || 'IT'} Track
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${student.enrollmentStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                      ${student.enrollmentStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                      ${student.enrollmentStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                    `}>
                      {student.enrollmentStatus.charAt(0).toUpperCase() + student.enrollmentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleView(student._id)}
                      disabled={actionLoading === student._id}
                      className="text-purple-600 hover:text-purple-800 font-medium bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-md transition-colors text-xs"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleDelete(student._id)}
                      disabled={actionLoading === student._id}
                      className="text-slate-500 hover:text-red-600 font-medium bg-slate-50 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Student Details</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Personal Info</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500">Name</div>
                      <div className="font-medium text-slate-800">{selectedStudent.userId?.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Email</div>
                      <div className="font-medium text-slate-800">{selectedStudent.userId?.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Phone</div>
                      <div className="font-medium text-slate-800">{selectedStudent.userId?.mobile}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Academic Info</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500">College Name</div>
                      <div className="font-medium text-slate-800">{selectedStudent.collegeName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Degree & Department</div>
                      <div className="font-medium text-slate-800">{selectedStudent.degree} in {selectedStudent.department}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Domain & Track</div>
                      <div className="font-medium text-slate-800">
                        {selectedStudent.preferredDomain} ({selectedStudent.industryTrack || 'IT'} Track)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Assessment Scores</h3>
                {selectedStudent.assessments && selectedStudent.assessments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.assessments.map((assessment, index) => (
                      <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-slate-800">{assessment.domain}</div>
                          <div className="text-xs text-slate-500">Score: {assessment.score} / {assessment.totalQuestions} ({assessment.percentage}%)</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          assessment.passFail === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {assessment.passFail}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-500 text-sm">
                    No assessments completed yet.
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Documents & Certificates</h3>
                <div className="space-y-4">
                  
                  {/* Resume Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-800">Uploaded Resume</div>
                      <div className="text-xs text-slate-500">
                        {selectedStudent.resumeUrl ? `ATS Score: ${selectedStudent.atsScore || 0}%` : 'No resume uploaded'}
                      </div>
                    </div>
                    {selectedStudent.resumeUrl ? (
                      <a 
                        href={selectedStudent.resumeUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-xs font-bold transition-colors"
                      >
                        View Resume
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Not Available</span>
                    )}
                  </div>

                  {/* Certificates Section */}
                  {selectedStudent.certificates && selectedStudent.certificates.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Added Certificates</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedStudent.certificates.map((cert, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between hover:border-indigo-300 transition-colors">
                            <div>
                              <div className="font-bold text-slate-800 text-sm line-clamp-1" title={cert.name}>{cert.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{cert.issuedBy}</div>
                            </div>
                            <div className="mt-3 flex justify-between items-center border-t border-slate-100 pt-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(cert.date).toLocaleDateString()}</span>
                              <a 
                                href={cert.fileUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                              >
                                View
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
