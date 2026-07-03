'use client';

import { useState, useEffect } from 'react';
import SkillGapReportButton from '@/components/SkillGapReportButton';

const SearchIcon = () => (
  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const UserIcon = ({ className = "w-10 h-10" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
);

export default function CollegeStudentsPage() {
  const [students, setStudents] = useState([]);
  const [metrics, setMetrics] = useState({ totalRegistered: 0, pendingCount: 0, approvedCount: 0 });
  const [filterOptions, setFilterOptions] = useState({ departments: [], degrees: [] });
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [degree, setDegree] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [page, department, degree, status]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: 10,
        search,
        department,
        degree,
        status,
      });
      const res = await fetch(`/api/college/students?${query}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setMetrics(data.metrics || { totalRegistered: 0, pendingCount: 0, approvedCount: 0 });
        setFilterOptions(data.filters || { departments: [], degrees: [] });
        setTotalPages(data.pagination.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const resetFilters = () => {
    setSearch('');
    setDepartment('');
    setDegree('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
        <p className="text-slate-500 mt-1">Manage and track your registered students status and profiles.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Registered</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{metrics.totalRegistered}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
            S
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Approved</p>
            <p className="text-3xl font-black text-green-600 mt-2">{metrics.approvedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-xl">
            ✓
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Pending Approvals</p>
            <p className="text-3xl font-black text-amber-500 mt-2">{metrics.pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold text-xl">
            !
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by student name, email, or register number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/10">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-50">
          <select
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs"
          >
            <option value="">All Departments</option>
            {filterOptions.departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={degree}
            onChange={(e) => { setDegree(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Degrees</option>
            {filterOptions.degrees.map(deg => (
              <option key={deg} value={deg}>{deg}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button onClick={resetFilters} className="text-sm font-semibold text-slate-500 hover:text-indigo-600 ml-auto transition-colors">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Student Name</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Academics</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Registration Info</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Status</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading student directory...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    No students found matching filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{student.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{student.email}</div>
                      <div className="text-xs text-slate-400">{student.mobile}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{student.degree}</div>
                      <div className="text-xs text-slate-500">{student.department}</div>
                      <div className="text-xs text-indigo-600 font-semibold mt-1">
                        CGPA: {student.cgpa || 'N/A'} | Arrears: {student.activeArrears ?? 0}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{student.registrationNumber || 'N/A'}</div>
                      {student.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 max-w-xs">
                          {student.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                              {skill}
                            </span>
                          ))}
                          {student.skills.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">+{student.skills.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${
                        student.enrollmentStatus === 'approved' ? 'bg-green-50 text-green-700' :
                        student.enrollmentStatus === 'rejected' ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {student.enrollmentStatus === 'approved' ? 'Approved' :
                         student.enrollmentStatus === 'rejected' ? 'Rejected' :
                         'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {student.resumeUrl && (
                          <a
                            href={student.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                          >
                            View Resume
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Student Profile Summary</h3>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors text-2xl font-light"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header profile info */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserIcon className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{selectedStudent.name}</h4>
                  <p className="text-slate-500 text-sm mt-0.5">{selectedStudent.email} | {selectedStudent.mobile}</p>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Registration Number</p>
                  <p className="text-slate-800 font-semibold mt-1">{selectedStudent.registrationNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Current Status</p>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block mt-1 ${
                    selectedStudent.enrollmentStatus === 'approved' ? 'bg-green-50 text-green-700' :
                    selectedStudent.enrollmentStatus === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {selectedStudent.enrollmentStatus?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Degree</p>
                  <p className="text-slate-800 font-semibold mt-1">{selectedStudent.degree}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Department</p>
                  <p className="text-slate-800 font-semibold mt-1">{selectedStudent.department}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">CGPA</p>
                  <p className="text-slate-800 font-semibold mt-1">{selectedStudent.cgpa || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Active Arrears</p>
                  <p className="text-slate-800 font-semibold mt-1">{selectedStudent.activeArrears ?? 0}</p>
                </div>
              </div>

              {/* Skills section */}
              {selectedStudent.skills?.length > 0 && (
                <div className="pt-6 border-t border-slate-100">
                  <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2.5">Key Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-end gap-3 rounded-b-2xl">
              <SkillGapReportButton studentId={selectedStudent._id} className="mr-auto" />
              {selectedStudent.resumeUrl && (
                <a
                  href={selectedStudent.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors text-center shadow-lg shadow-indigo-900/10"
                >
                  View Full Resume
                </a>
              )}
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-sm transition-colors"
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
