'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function CandidateRankingTable({ role = 'college' }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ track: '', domain: '', minScore: 0 });

  useEffect(() => {
    fetchCandidates();
  }, [page, filters]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page, limit: 15,
        track: filters.track,
        domain: filters.domain,
        minScore: filters.minScore
      });
      const res = await fetch(`/api/candidates/ranking?${query}`);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleShortlist = async (studentId, isShortlisted) => {
    try {
      // Optimistic update
      setCandidates(candidates.map(c => c._id === studentId ? { ...c, isShortlisted: !isShortlisted } : c));
      
      await fetch('/api/candidates/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, action: isShortlisted ? 'remove' : 'add' })
      });
    } catch (err) {
      console.error('Shortlist error', err);
      fetchCandidates(); // Revert on error
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const getBadgeColor = (level) => {
    switch (level) {
      case 'Job Ready': return 'bg-emerald-100 text-emerald-800';
      case 'Advanced': return 'bg-blue-100 text-blue-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Beginner': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportCSV = () => {
    const csv = Papa.unparse(candidates.map(c => ({
      Name: c.name, Email: c.email, College: c.college,
      Domain: c.preferredDomain, Track: c.industryTrack,
      'Employability Score': c.employabilityScore, 'Readiness Level': c.readinessLevel,
      Shortlisted: c.isShortlisted ? 'Yes' : 'No'
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'candidate_ranking.csv'; a.click();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(candidates.map(c => ({
      Name: c.name, Email: c.email, College: c.college,
      Domain: c.preferredDomain, Track: c.industryTrack,
      EmployabilityScore: c.employabilityScore, ReadinessLevel: c.readinessLevel,
      Shortlisted: c.isShortlisted ? 'Yes' : 'No'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ranking');
    XLSX.writeFile(wb, 'candidate_ranking.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Candidate Ranking Report', 14, 15);
    doc.autoTable({
      head: [['Name', 'Email', 'College', 'Domain', 'Emp Score', 'Readiness', 'Shortlisted']],
      body: candidates.map(c => [
        c.name, c.email, c.college, c.preferredDomain, c.employabilityScore, c.readinessLevel, c.isShortlisted ? 'Yes' : 'No'
      ]),
      startY: 20
    });
    doc.save('candidate_ranking.pdf');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-4 w-full md:w-auto">
          <select name="track" onChange={handleFilterChange} className="p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500">
            <option value="">All Tracks</option>
            <option value="IT / Engineering">IT / Engineering</option>
            <option value="Admin / Management">Admin / Management</option>
            <option value="Medical">Medical</option>
          </select>
          <input type="number" name="minScore" placeholder="Min Score" onChange={handleFilterChange} className="p-2 text-sm border border-slate-300 rounded w-32 focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-bold bg-slate-200 text-slate-700 rounded hover:bg-slate-300">CSV</button>
          <button onClick={exportExcel} className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200">Excel</button>
          <button onClick={exportPDF} className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-800 rounded hover:bg-red-200">PDF</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Candidate</th>
              {role === 'super_admin' && <th className="px-4 py-3">College</th>}
              <th className="px-4 py-3">Domain / Track</th>
              <th className="px-4 py-3">Employability</th>
              <th className="px-4 py-3">Readiness</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-8">Loading candidates...</td></tr>
            ) : candidates.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-8 text-slate-500">No candidates found</td></tr>
            ) : (
              candidates.map((c, idx) => (
                <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-400">#{(page - 1) * 15 + idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.email}</div>
                  </td>
                  {role === 'super_admin' && <td className="px-4 py-3 text-slate-600">{c.college}</td>}
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{c.preferredDomain}</div>
                    <div className="text-xs text-slate-500">{c.industryTrack}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${c.employabilityScore > 75 ? 'bg-emerald-500' : c.employabilityScore > 50 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${c.employabilityScore}%` }}></div>
                      </div>
                      <span className="font-black text-slate-800">{c.employabilityScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getBadgeColor(c.readinessLevel)}`}>
                      {c.readinessLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => toggleShortlist(c._id, c.isShortlisted)}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${c.isShortlisted ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                    >
                      {c.isShortlisted ? 'Shortlisted ✓' : 'Shortlist'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-600 bg-slate-50">
        <div>Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-white border border-slate-300 rounded disabled:opacity-50 hover:bg-slate-50">Previous</button>
          <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-white border border-slate-300 rounded disabled:opacity-50 hover:bg-slate-50">Next</button>
        </div>
      </div>
    </div>
  );
}
