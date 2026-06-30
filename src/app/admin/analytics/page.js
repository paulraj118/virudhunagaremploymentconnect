'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [globalData, setGlobalData] = useState(null);
  
  // Candidates State
  const [candidates, setCandidates] = useState([]);
  const [cLoading, setCLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ 
    keyword: '', domain: '', track: '', collegeName: '', status: '', scoreRange: '', date: '', sortBy: 'latest' 
  });
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchGlobalData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if(page !== 1) setPage(1);
      else fetchCandidates();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [filters.keyword, filters.domain, filters.track, filters.collegeName, filters.status, filters.scoreRange, filters.date, filters.sortBy]);

  useEffect(() => {
    fetchCandidates();
  }, [page]);

  const fetchGlobalData = async () => {
    try {
      const res = await fetch('/api/admin/analytics/self-assessment');
      const data = await res.json();
      if (data.success) {
        setGlobalData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    setCLoading(true);
    try {
      const query = new URLSearchParams({ page, ...filters });
      const res = await fetch(`/api/admin/analytics/self-assessment/candidates?${query}`);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCLoading(false);
    }
  };

  const fetchExportData = async () => {
    try {
      const query = new URLSearchParams({ ...filters, export: 'true' });
      const res = await fetch(`/api/admin/analytics/self-assessment/candidates?${query}`);
      const data = await res.json();
      if (data.success) {
        return data.candidates.map(c => ({
          Name: c.name, Email: c.email, College: c.collegeName, Domain: c.domain,
          Track: c.track, Date: new Date(c.date).toLocaleDateString(),
          Status: c.status, Score: `${c.score}%`, Level: c.level, Result: c.result
        }));
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const exportCandidatesToCSV = async () => {
    const dataToExport = await fetchExportData();
    if (!dataToExport.length) return alert('No data to export');
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Candidates_Analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCandidatesToExcel = async () => {
    const dataToExport = await fetchExportData();
    if (!dataToExport.length) return alert('No data to export');
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
    XLSX.writeFile(workbook, 'Candidates_Analytics.xlsx');
  };

  const exportCandidatesToPDF = async () => {
    const dataToExport = await fetchExportData();
    if (!dataToExport.length) return alert('No data to export');
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.text('Self Assessment Candidate Analytics', 40, 40);
    
    const tableColumn = ["Name", "Email", "College", "Domain", "Track", "Date", "Score", "Level", "Result"];
    const tableRows = [];

    dataToExport.forEach(c => {
      const row = [
        c.Name, c.Email, c.College, c.Domain, c.Track, 
        c.Date, 
        c.Score, c.Level, c.Result
      ];
      tableRows.push(row);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 50,
    });
    
    doc.save('Candidates_Analytics.pdf');
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center gap-4 text-slate-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p>Loading Analytics...</p>
      </div>
    );
  }

  if (!globalData) {
    return <div className="p-6 text-center text-red-500">Failed to load analytics data.</div>;
  }

  const { kpis, charts, domainAnalytics } = globalData;

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Self Assessment Analytics</h1>
        <p className="text-slate-500">System health and candidate performance insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Questions" value={kpis.totalQuestions} />
        <MetricCard title="Total Assessments" value={kpis.totalAssessments} />
        <MetricCard title="Unique Candidates" value={kpis.totalCandidatesCompleted} />
        <MetricCard title="Average Score" value={`${kpis.averageScore}%`} color="text-blue-600" />
        <MetricCard title="Highest Score" value={`${kpis.highestScore}%`} color="text-emerald-600" />
        <MetricCard title="Lowest Score" value={`${kpis.lowestScore}%`} color="text-red-600" />
        <MetricCard title="Total Domains" value={kpis.totalPreferredDomains} />
        <div className={`bg-white p-4 rounded-xl shadow-sm border ${kpis.insufficientDomains > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
          <h3 className="text-slate-500 text-sm font-medium">Insufficient Domains (&lt;240 Qs)</h3>
          <p className={`text-2xl font-bold ${kpis.insufficientDomains > 0 ? 'text-red-600' : 'text-slate-800'}`}>{kpis.insufficientDomains}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Assessments by Preferred Domain (Top 10)">
          {charts.assessmentsByDomain.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.assessmentsByDomain} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8884d8" name="Assessments" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="Assessments by Industry Track (Top 10)">
          {charts.assessmentsByIndustry.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.assessmentsByIndustry} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#82ca9d" name="Assessments" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="Question Levels">
          {charts.questionDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={charts.questionDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {charts.questionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="Pass vs Fail Ratio">
          {charts.passFailRatio.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={charts.passFailRatio} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {charts.passFailRatio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Pass' ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
        
        <ChartCard title="Score Distribution">
          {charts.scoreDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 10}} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#ffc658" name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      {/* Monthly Activity Line Chart */}
      <ChartCard title="Monthly Assessment Activity">
        {charts.monthlyActivity.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.monthlyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="assessments" stroke="#8884d8" activeDot={{ r: 8 }} name="Assessments Completed" />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </ChartCard>

      {/* Domain Analytics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800">Domain Analytics</h2>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-white shadow-xs">
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium text-center">Total Qs</th>
                <th className="px-4 py-3 font-medium text-center">Low/Med/High</th>
                <th className="px-4 py-3 font-medium text-center">Assessments</th>
                <th className="px-4 py-3 font-medium text-center">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {domainAnalytics.map((d, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {d.domain}
                    {d.insufficient && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Insufficient Qs</span>}
                  </td>
                  <td className={`px-4 py-3 text-center font-bold ${d.insufficient ? 'text-red-600' : 'text-slate-800'}`}>{d.totalQuestions}</td>
                  <td className="px-4 py-3 text-center text-xs space-x-1">
                    <span className="text-green-600">{d.lowQuestions}</span> / 
                    <span className="text-yellow-600">{d.mediumQuestions}</span> / 
                    <span className="text-red-600">{d.highQuestions}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{d.totalAssessments}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${d.averageScore >= 60 ? 'bg-green-100 text-green-700' : d.averageScore > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                      {d.averageScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Analytics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800">Candidate Analytics</h2>
          <div className="flex gap-2">
            <button onClick={exportCandidatesToCSV} className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded hover:bg-slate-700 transition">CSV</button>
            <button onClick={exportCandidatesToExcel} className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded hover:bg-slate-700 transition">Excel</button>
            <button onClick={exportCandidatesToPDF} className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded hover:bg-slate-700 transition">PDF</button>
          </div>
        </div>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4">
          <input 
            type="text" placeholder="Search Name or Email..." 
            className="px-3 py-2 text-sm border rounded border-slate-300 flex-1 min-w-[150px]"
            value={filters.keyword} onChange={(e) => setFilters({...filters, keyword: e.target.value})}
          />
          <input 
            type="text" placeholder="Filter College Name" 
            className="px-3 py-2 text-sm border rounded border-slate-300 flex-1 min-w-[150px]"
            value={filters.collegeName} onChange={(e) => setFilters({...filters, collegeName: e.target.value})}
          />
          <input 
            type="text" placeholder="Filter Domain" 
            className="px-3 py-2 text-sm border rounded border-slate-300 w-32"
            value={filters.domain} onChange={(e) => setFilters({...filters, domain: e.target.value})}
          />
          <input 
            type="text" placeholder="Filter Track" 
            className="px-3 py-2 text-sm border rounded border-slate-300 w-32"
            value={filters.track} onChange={(e) => setFilters({...filters, track: e.target.value})}
          />
          <select 
            className="px-3 py-2 text-sm border rounded border-slate-300 w-32"
            value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
          </select>
          <select 
            className="px-3 py-2 text-sm border rounded border-slate-300 w-36"
            value={filters.scoreRange} onChange={(e) => setFilters({...filters, scoreRange: e.target.value})}
          >
            <option value="">All Scores</option>
            <option value="0-30">0% - 30%</option>
            <option value="31-60">31% - 60%</option>
            <option value="61-80">61% - 80%</option>
            <option value="81-100">81% - 100%</option>
          </select>
          <input 
            type="date" 
            className="px-3 py-2 text-sm border rounded border-slate-300 w-36"
            title="Assessment Date"
            value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})}
          />
          <select 
            className="px-3 py-2 text-sm border rounded border-slate-300 w-40"
            value={filters.sortBy} onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
          >
            <option value="latest">Sort: Latest</option>
            <option value="highest_score">Sort: Highest Score</option>
            <option value="lowest_score">Sort: Lowest Score</option>
            <option value="candidate_name">Sort: Candidate A-Z</option>
            <option value="college_name">Sort: College A-Z</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">College Name</th>
                <th className="px-4 py-3 font-medium">Domain & Track</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Status / Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cLoading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">Loading Candidates...</td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500 font-medium">No assessment reports available.</td></tr>
              ) : (
                candidates.map(c => (
                  <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.collegeName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{c.domain}</div>
                      <div className="text-xs text-slate-500">{c.track}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${c.result === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>{c.score}%</span>
                      <div className="text-xs text-slate-500">{c.result}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {c.status}
                      </span>
                      <div className="text-slate-500 text-xs mt-1">{new Date(c.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => setSelectedReport(c.fullReport)}
                        className="px-3 py-1.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 flex justify-between items-center bg-slate-50">
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-white border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50">Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-white border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
      
      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Assessment Report</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedReport.userInfo?.name || 'Candidate'} - {selectedReport.preferredDomain}</p>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-white flex-1 space-y-8">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">Score</p>
                  <p className="text-2xl font-black text-indigo-900">{selectedReport.percentage || 0}%</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Status</p>
                  <p className="text-2xl font-black text-emerald-900 capitalize">{selectedReport.status}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Readiness</p>
                  <p className="text-2xl font-black text-blue-900">{selectedReport.interviewReadiness || 0}/100</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Time Taken</p>
                  <p className="text-2xl font-black text-purple-900">{Math.floor((selectedReport.timeTaken || 0) / 60)}m {(selectedReport.timeTaken || 0) % 60}s</p>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Top Strengths
                  </h4>
                  <ul className="space-y-2">
                    {selectedReport.strengths?.length > 0 ? selectedReport.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span> {s}
                      </li>
                    )) : <li className="text-sm text-emerald-600/70">No strengths recorded.</li>}
                  </ul>
                </div>
                <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-100">
                  <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {selectedReport.weaknesses?.length > 0 ? selectedReport.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-rose-700 flex items-start gap-2">
                        <span className="text-rose-500 mt-0.5">•</span> {w}
                      </li>
                    )) : <li className="text-sm text-rose-600/70">No weaknesses recorded.</li>}
                  </ul>
                </div>
              </div>
              
              {/* AI Recommendations */}
              {selectedReport.overallRecommendation && (
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                    Recommendations
                  </h4>
                  <p className="text-sm text-blue-700">{selectedReport.overallRecommendation}</p>
                  {selectedReport.suggestions && selectedReport.suggestions.length > 0 && (
                    <ul className="space-y-2 mt-4">
                      {selectedReport.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Detailed Questions */}
              {selectedReport.questions && selectedReport.questions.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Question Breakdown</h4>
                  <div className="space-y-4">
                    {selectedReport.questions.map((q, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border ${q.isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-semibold text-slate-800"><span className="text-slate-500 mr-2">Q{idx + 1}.</span> {q.questionText}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ml-2 ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {q.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 mt-3">
                          {q.options?.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-2 rounded text-xs border ${
                              oIdx === q.correctOptionIndex ? 'bg-emerald-100 border-emerald-300 font-bold text-emerald-800' : 
                              oIdx === q.selectedOptionIndex ? 'bg-rose-100 border-rose-300 font-bold text-rose-800' : 
                              'bg-white border-slate-200 text-slate-600'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                        {!q.isCorrect && q.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                            <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function MetricCard({ title, value, color = "text-slate-800" }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
      <h3 className="text-slate-800 font-bold mb-4">{title}</h3>
      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function NoData() {
  return <p className="text-slate-400 text-sm italic">No data available yet.</p>;
}
