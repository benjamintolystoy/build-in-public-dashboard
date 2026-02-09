'use client';
import { useEffect, useState } from 'react';
import { DashboardData } from '@/lib/types';
import { fetchDashboardData } from '@/lib/api';
import StatCard from '@/components/StatCard';

export default function InfluencersPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { fetchDashboardData().then(setData); }, []);
  if (!data) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const influencers = Object.entries(data.influencers.influencers);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Influencers</h1>
        <p className="text-sm text-gray-500 mt-1">Monitoring {influencers.length} accounts</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Tracked" value={influencers.length} />
        <StatCard label="Total Followers" value={influencers.reduce((s, [, i]) => s + i.followers, 0).toLocaleString()} />
        <StatCard label="Last Check" value={data.influencers.last_check ? new Date(data.influencers.last_check).toLocaleDateString() : 'Never'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {influencers.map(([handle, info]) => (
          <div key={handle} className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <a href={`https://x.com/${info.username}`} target="_blank" rel="noopener noreferrer" className="text-white font-semibold hover:text-blue-400 transition-colors">@{info.username}</a>
                <p className="text-xs text-gray-500 mt-0.5">{info.followers.toLocaleString()} followers</p>
              </div>
              <span className="text-xs text-gray-600 bg-[#1e293b] px-2 py-1 rounded">tracked</span>
            </div>
            <p className="text-sm text-gray-400">{info.why}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
