import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SelfAssessmentQuestion from '@/models/SelfAssessmentQuestion';
import { getCurrentUser } from '@/lib/auth';
import { MASTER_DOMAINS } from '@/lib/domainConstants';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Stats aggregation
    const totalQuestions = await SelfAssessmentQuestion.countDocuments();
    
    const levelCounts = await SelfAssessmentQuestion.aggregate([
      { $group: { _id: "$level", count: { $sum: 1 } } }
    ]);
    
    let lowCount = 0;
    let mediumCount = 0;
    let highCount = 0;
    
    levelCounts.forEach(l => {
      if(l._id === 'low') lowCount = l.count;
      if(l._id === 'medium') mediumCount = l.count;
      if(l._id === 'high') highCount = l.count;
    });

    const dbDomainCounts = await SelfAssessmentQuestion.aggregate([
      { $group: { _id: "$domain", count: { $sum: 1 } } }
    ]);

    const domainCountMap = {};
    dbDomainCounts.forEach(d => { domainCountMap[d._id] = d.count; });

    const allDomains = new Set([...MASTER_DOMAINS, ...dbDomainCounts.map(d => d._id)]);

    const domainCounts = Array.from(allDomains).map(domain => ({
      _id: domain,
      count: domainCountMap[domain] || 0
    }));

    const totalDomains = domainCounts.length;
    const insufficientDomains = domainCounts
      .filter(d => d.count < 240)
      .map(d => ({ domain: d._id, count: d.count }));

    // Find last updated
    const lastQuestion = await SelfAssessmentQuestion.findOne().sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      stats: {
        totalQuestions,
        totalDomains,
        lowCount,
        mediumCount,
        highCount,
        insufficientDomains,
        lastUpdated: lastQuestion ? lastQuestion.updatedAt : null
      }
    });

  } catch (error) {
    console.error('Fetch Admin Question Stats Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
