'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCollege, setFilterCollege] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const filteredInterviews = interviews.filter(inv => {
    const matchesCollege = !filterCollege || inv.collegeName?.toLowerCase().includes(filterCollege.toLowerCase());
    const matchesGender = !filterGender || (inv.gender || 'Not Specified').toLowerCase() === filterGender.toLowerCase();
    const matchesCompany = !filterCompany || inv.companyId?.companyName?.toLowerCase().includes(filterCompany.toLowerCase());
    const matchesRole = !filterRole || inv.driveId?.jobRole?.toLowerCase().includes(filterRole.toLowerCase());
    return matchesCollege && matchesGender && matchesCompany && matchesRole;
  });

  const exportToCSV = () => {
    const dataToExport = filteredInterviews.map(inv => ({
      'Candidate Name': inv.studentName,
      'Gender': inv.gender || 'Not Specified',
      'College': inv.collegeName,
      'Company Name': inv.companyId?.companyName || 'N/A',
      'Job Role': inv.driveId?.jobRole || 'N/A',
      'Type': inv.type || 'N/A',
      'Date': new Date(inv.date).toLocaleDateString(),
      'Time': `${inv.startTime} - ${inv.endTime}`,
      'Status': inv.status
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scheduled_interviews_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const dataToExport = filteredInterviews.map(inv => ({
      'Candidate Name': inv.studentName,
      'Gender': inv.gender || 'Not Specified',
      'College': inv.collegeName,
      'Company Name': inv.companyId?.companyName || 'N/A',
      'Job Role': inv.driveId?.jobRole || 'N/A',
      'Type': inv.type || 'N/A',
      'Date': new Date(inv.date).toLocaleDateString(),
      'Time': `${inv.startTime} - ${inv.endTime}`,
      'Status': inv.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Interviews');
    XLSX.writeFile(workbook, `scheduled_interviews_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Scheduled Interviews Report', 14, 15);
    doc.autoTable({
      head: [['Candidate', 'Gender', 'College', 'Company', 'Role & Type', 'Schedule', 'Status']],
      body: filteredInterviews.map(inv => [
        inv.studentName, inv.gender || 'Not Specified', inv.collegeName, inv.companyId?.companyName || 'N/A', `${inv.driveId?.jobRole || 'N/A'} - ${inv.type || 'N/A'}`, `${new Date(inv.date).toLocaleDateString()} (${inv.startTime}-${inv.endTime})`, inv.status
      ]),
      startY: 20
    });
    doc.save(`scheduled_interviews_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetch('/api/admin/interviews');
      const data = await res.json();
      if (data.success) {
        setInterviews(data.interviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Platform Interviews</h1>
          <p className="text-slate-500 text-sm">Global overview of all scheduled interviews.</p>
        </div>
      </div>

      {/* Search and Export Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <input 
            type="text"
            placeholder="Filter College..."
            value={filterCollege}
            onChange={(e) => setFilterCollege(e.target.value)}
            className="p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 w-full sm:w-40"
          />
          <select 
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 w-full sm:w-40"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="transgender">Transgender</option>
          </select>
          <input 
            type="text"
            placeholder="Filter Company..."
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 w-full sm:w-40"
          />
          <input 
            type="text"
            placeholder="Filter Role..."
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 w-full sm:w-40"
          />
        </div>
        <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end">
          <button onClick={exportToCSV} className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 border border-slate-200 transition">CSV</button>
          <button onClick={exportToExcel} className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition">Excel</button>
          <button onClick={exportToPDF} className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-800 rounded-lg hover:bg-red-100 border border-red-200 transition">PDF</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-bold">Candidate</th>
              <th className="p-4 font-bold">Gender</th>
              <th className="p-4 font-bold">College</th>
              <th className="p-4 font-bold">Company & Role</th>
              <th className="p-4 font-bold">Schedule</th>
              <th className="p-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredInterviews.map(inv => (
              <tr key={inv._id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-bold text-slate-800">{inv.studentName}</div>
                  <div className="text-xs text-slate-500">{inv.studentId?.userId?.email}</div>
                </td>
                <td className="p-4 text-xs font-bold text-slate-600 uppercase">{inv.gender || 'Not Specified'}</td>
                <td className="p-4 text-slate-600">{inv.collegeName}</td>
                <td className="p-4">
                  <div className="font-bold text-indigo-600">{inv.companyId?.companyName}</div>
                  <div className="text-xs text-slate-500">{inv.driveId?.jobRole} - {inv.type}</div>
                </td>
                <td className="p-4 text-slate-600">
                  <div className="font-semibold">{new Date(inv.date).toLocaleDateString()}</div>
                  <div className="text-xs">{inv.startTime} - {inv.endTime}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    inv.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    inv.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredInterviews.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">No interviews have been scheduled yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
