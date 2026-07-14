'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCollege, setFilterCollege] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const filteredOffers = offers.filter(off => {
    const matchesCollege = !filterCollege || off.collegeName?.toLowerCase().includes(filterCollege.toLowerCase());
    const matchesGender = !filterGender || (off.gender || 'Not Specified').toLowerCase() === filterGender.toLowerCase();
    const matchesCompany = !filterCompany || off.companyId?.companyName?.toLowerCase().includes(filterCompany.toLowerCase());
    const matchesRole = !filterRole || off.jobRole?.toLowerCase().includes(filterRole.toLowerCase());
    return matchesCollege && matchesGender && matchesCompany && matchesRole;
  });

  const exportToCSV = () => {
    const dataToExport = filteredOffers.map(off => ({
      'Offer ID': off.offerId,
      'Candidate Name': off.studentName,
      'Gender': off.gender || 'Not Specified',
      'College': off.collegeName,
      'Company Name': off.companyId?.companyName || 'N/A',
      'Job Role': off.jobRole || 'N/A',
      'Package': off.salaryPackage || 'N/A',
      'Status': off.status
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `offers_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const dataToExport = filteredOffers.map(off => ({
      'Offer ID': off.offerId,
      'Candidate Name': off.studentName,
      'Gender': off.gender || 'Not Specified',
      'College': off.collegeName,
      'Company Name': off.companyId?.companyName || 'N/A',
      'Job Role': off.jobRole || 'N/A',
      'Package': off.salaryPackage || 'N/A',
      'Status': off.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Offers');
    XLSX.writeFile(workbook, `offers_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Job Offers Report', 14, 15);
    doc.autoTable({
      head: [['Offer ID', 'Candidate', 'Gender', 'College', 'Company', 'Job Role', 'Package', 'Status']],
      body: filteredOffers.map(off => [
        off.offerId, off.studentName, off.gender || 'Not Specified', off.collegeName, off.companyId?.companyName || 'N/A', off.jobRole || 'N/A', off.salaryPackage || 'N/A', off.status
      ]),
      startY: 20
    });
    doc.save(`offers_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/admin/offers');
      const data = await res.json();
      if (data.success) {
        setOffers(data.offers);
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
          <h1 className="text-2xl font-bold text-slate-800">Platform Offers</h1>
          <p className="text-slate-500 text-sm">Global overview of all generated job offers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Offers</p>
          <p className="text-2xl font-black text-slate-800">{offers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50">
          <p className="text-xs font-bold text-emerald-600 uppercase">Accepted</p>
          <p className="text-2xl font-black text-emerald-700">{offers.filter(o => o.status === 'Accepted').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50">
          <p className="text-xs font-bold text-rose-600 uppercase">Rejected</p>
          <p className="text-2xl font-black text-rose-700">{offers.filter(o => o.status === 'Rejected').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm bg-indigo-50">
          <p className="text-xs font-bold text-indigo-600 uppercase">Pending</p>
          <p className="text-2xl font-black text-indigo-700">{offers.filter(o => o.status === 'Released').length}</p>
        </div>
      </div>

      {/* Search and Export Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
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
              <th className="p-4 font-bold">Offer ID</th>
              <th className="p-4 font-bold">Candidate & College</th>
              <th className="p-4 font-bold">Gender</th>
              <th className="p-4 font-bold">Company & Role</th>
              <th className="p-4 font-bold">Package</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-center">Offer Letter</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredOffers.map(offer => (
              <tr key={offer._id} className="hover:bg-slate-50">
                <td className="p-4 text-xs font-mono font-bold text-slate-500">{offer.offerId}</td>
                <td className="p-4">
                  <div className="font-bold text-slate-800">{offer.studentName}</div>
                  <div className="text-xs text-slate-500">{offer.studentId?.userId?.email}</div>
                  <div className="text-xs text-slate-500 font-medium">{offer.collegeName}</div>
                </td>
                <td className="p-4 text-xs font-bold text-slate-600 uppercase">{offer.gender || 'Not Specified'}</td>
                <td className="p-4">
                  <div className="font-bold text-indigo-600">{offer.companyId?.companyName}</div>
                  <div className="text-xs text-slate-500">{offer.jobRole}</div>
                </td>
                <td className="p-4 text-sm font-bold text-emerald-600">{offer.salaryPackage}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    offer.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                    offer.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                    offer.status === 'Withdrawn' ? 'bg-slate-200 text-slate-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    {offer.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {offer.offerLetterUrl ? (
                    <a 
                      href={offer.offerLetterUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">N/A</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredOffers.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">No offers have been generated yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
