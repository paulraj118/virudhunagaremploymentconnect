'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CompanyApprovals() {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompanies = (companies || []).filter(company => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      company.companyName?.toLowerCase().includes(query) ||
      company.hrName?.toLowerCase().includes(query) ||
      company.userId?.email?.toLowerCase().includes(query) ||
      company.industryType?.toLowerCase().includes(query) ||
      company.gstNumber?.toLowerCase().includes(query)
    );
  });

  const viewCertificate = (dataUrl, label) => {
    if (!dataUrl) return;
    if (dataUrl.startsWith('data:application/pdf')) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${label}.pdf`;
      link.click();
    } else {
      setPreviewCert({ url: dataUrl, label });
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    if (!confirm(`Are you sure you want to mark this company as ${status}?`)) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchCompanies();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this company permanently?')) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchCompanies();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Delete failed');
    } finally {
      setActionLoading(false);
    }
  };



  const handleView = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/companies/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCompany(data.data);
        setIsModalOpen(true);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Failed to fetch company details');
    } finally {
      setActionLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Company Name', 'HR Contact', 'Email', 'Industry', 'Size', 'Status', 'Website'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    companies.forEach(company => {
      const row = [
        `"${company.companyName}"`,
        `"${company.hrName}"`,
        `"${company.userId?.email || ''}"`,
        `"${company.industryType}"`,
        `"${company.companySize}"`,
        `"${company.approvalStatus}"`,
        `"${company.website || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'companies_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <div className="p-8">Loading companies...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Company Approvals</h1>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Export CSV
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Companies</div>
              <div className="text-xl font-bold text-slate-800">{stats.totalCompanies}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"></path></svg>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Companies</div>
              <div className="text-xl font-bold text-slate-800">{stats.activeCompanies}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</div>
              <div className="text-xl font-bold text-slate-800">{stats.pendingApprovals}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Search companies, HR contacts, GST numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
        <div className="w-full">
          <table className="w-full text-left text-sm text-slate-600 table-fixed">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-2 py-3 w-[22%]">Company Info</th>
                <th className="px-2 py-3 w-[20%]">HR Contact</th>
                <th className="px-2 py-3 w-[18%]">Industry & Size</th>
                <th className="px-2 py-3 w-[10%]">Status</th>
                <th className="px-2 py-3 w-[30%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.map((company) => (
                <tr key={company._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-3 break-words align-top">
                    <div className="font-semibold text-slate-800 break-words">{company.companyName}</div>
                    <div className="text-[10px] sm:text-xs text-blue-600 hover:underline break-all">
                      <a href={company.website} target="_blank" rel="noreferrer">{company.website}</a>
                    </div>
                  </td>
                  <td className="px-2 py-3 break-words align-top">
                    <div className="font-medium text-slate-700 break-words">{company.hrName}</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 break-all">{company.userId?.email}</div>
                  </td>
                  <td className="px-2 py-3 break-words align-top">
                    <div className="text-xs sm:text-sm text-slate-700 break-words">{company.industryType}</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 break-words">{company.companySize} employees</div>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border text-center break-words
                      ${company.approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                      ${company.approvalStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                      ${company.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                      ${company.approvalStatus === 'suspended' ? 'bg-slate-100 text-slate-700 border-slate-300' : ''}
                    `}>
                      {company.approvalStatus.charAt(0).toUpperCase() + company.approvalStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="flex flex-row items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                      {company.approvalStatus === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleAction(company._id, 'approved')}
                            disabled={actionLoading === company._id}
                            className="text-emerald-600 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors text-xs whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleAction(company._id, 'rejected')}
                            disabled={actionLoading === company._id}
                            className="text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors text-xs whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {company.approvalStatus === 'approved' && (
                        <button 
                          onClick={() => handleAction(company._id, 'suspended')}
                          disabled={actionLoading === company._id}
                          className="text-amber-600 hover:text-amber-800 font-medium bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md transition-colors text-xs whitespace-nowrap"
                        >
                          Suspend
                        </button>
                      )}
                      <button 
                        onClick={() => handleView(company._id)}
                        disabled={actionLoading === company._id}
                        className="text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors text-xs whitespace-nowrap"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDelete(company._id)}
                        disabled={actionLoading === company._id}
                        className="text-slate-500 hover:text-red-600 font-medium bg-slate-50 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors text-xs whitespace-nowrap"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    {searchQuery ? 'No companies found matching your search.' : 'No companies registered yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Details Modal */}
      {isModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Company Details</h2>
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
                  <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Company Info</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500">Company Name</div>
                      <div className="font-medium text-slate-800">{selectedCompany.companyName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Industry & Size</div>
                      <div className="font-medium text-slate-800">{selectedCompany.industryType} • {selectedCompany.companySize} employees</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">GST Number & DPIIT</div>
                      <div className="font-medium text-slate-800">{selectedCompany.gstNumber} • DPIIT: {selectedCompany.dpiitRegistered}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Website & LinkedIn</div>
                      <div className="font-medium text-blue-600 hover:underline">
                        <a href={selectedCompany.website} target="_blank" rel="noreferrer">Website</a> • <a href={selectedCompany.linkedIn} target="_blank" rel="noreferrer">LinkedIn</a>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Contact Info</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500">HR Manager Name</div>
                      <div className="font-medium text-slate-800">{selectedCompany.hrName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Account Email</div>
                      <div className="font-medium text-slate-800">{selectedCompany.userId?.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Support Email & Phone</div>
                      <div className="font-medium text-slate-800">{selectedCompany.supportEmail || 'N/A'} • {selectedCompany.supportPhone || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Office Address</div>
                      <div className="font-medium text-slate-800 text-sm mt-0.5">{selectedCompany.address}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">About Us</h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-line">
                  {selectedCompany.description || 'No description provided.'}
                </div>
              </div>

              {/* Compliance & Certificates Section */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Compliance & Certificates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ESI Certificate */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">ESI Certificate</div>
                        {selectedCompany.esiCertificateUrl ? (
                          <button type="button" onClick={() => viewCertificate(selectedCompany.esiCertificateUrl, 'ESI_Certificate')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            View Certificate
                          </button>
                        ) : (
                          <div className="text-sm font-medium text-slate-400 mt-1">Not uploaded</div>
                        )}
                      </div>
                      {selectedCompany.esiCertificateUrl && (
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200">✓ Uploaded</span>
                      )}
                    </div>
                  </div>

                  {/* IT Certificate */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">IT Certificate (Last Year)</div>
                        {selectedCompany.itCertificateUrl ? (
                          <button type="button" onClick={() => viewCertificate(selectedCompany.itCertificateUrl, 'IT_Certificate')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            View Certificate
                          </button>
                        ) : (
                          <div className="text-sm font-medium text-slate-400 mt-1">Not uploaded</div>
                        )}
                      </div>
                      {selectedCompany.itCertificateUrl && (
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200">✓ Uploaded</span>
                      )}
                    </div>
                  </div>

                  {/* INC Certificate */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">INC Certificate</div>
                        {selectedCompany.incCertificateUrl ? (
                          <button type="button" onClick={() => viewCertificate(selectedCompany.incCertificateUrl, 'INC_Certificate')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            View Certificate
                          </button>
                        ) : (
                          <div className="text-sm font-medium text-slate-400 mt-1">Not uploaded</div>
                        )}
                      </div>
                      {selectedCompany.incCertificateUrl && (
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200">✓ Uploaded</span>
                      )}
                    </div>
                  </div>

                  {/* DPIIT Number */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div>
                      <div className="text-xs text-slate-500">DPIIT Number</div>
                      <div className={`text-sm font-medium mt-1 ${selectedCompany.dpiitNumber ? 'text-slate-800' : 'text-slate-400'}`}>
                        {selectedCompany.dpiitNumber || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Job Postings</h3>
                {selectedCompany.jobs && selectedCompany.jobs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedCompany.jobs.map((job) => (
                      <div key={job._id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-slate-800">{job.title}</div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${job.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {job.isActive ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-3">{job.department} • {job.location}</div>
                        <div className="flex justify-between text-xs border-t border-slate-100 pt-3">
                          <span className="text-slate-500">Salary: <span className="font-semibold text-slate-700">{job.salary}</span></span>
                          <span className="text-slate-500">Vacancies: <span className="font-semibold text-slate-700">{job.vacancyCount}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-500 text-sm">
                    No jobs posted yet.
                  </div>
                )}
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

      {/* Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setPreviewCert(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{previewCert.label.replace(/_/g, ' ')}</h3>
              <button onClick={() => setPreviewCert(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100">
              <img src={previewCert.url} alt={previewCert.label} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md" />
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <a href={previewCert.url} download={`${previewCert.label}.png`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold">
                Download
              </a>
              <button onClick={() => setPreviewCert(null)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
