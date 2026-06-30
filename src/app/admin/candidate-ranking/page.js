'use client';

import CandidateRankingTable from '@/components/CandidateRankingTable';

export default function AdminCandidateRanking() {
  return (
    <div className="p-6 max-w-7xl mx-auto font-sans space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Candidate Ranking & Shortlisting</h1>
        <p className="text-slate-500 mt-1">Global view of all candidates ranked by Employability Score.</p>
      </div>

      <CandidateRankingTable role="super_admin" />
    </div>
  );
}
