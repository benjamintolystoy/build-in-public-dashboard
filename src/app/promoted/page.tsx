'use client';
import { useEffect, useState } from 'react';
import { DashboardData } from '@/lib/types';
import { fetchDashboardData } from '@/lib/api';
import StatCard from '@/components/StatCard';

export default function PromotedPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { fetchDashboardData().then(setData); }, []);
  if (!data) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const { promoted } = data;
  const active = promoted.promoted_tweets.filter(t => t.status === 'active').length;
  const completed = promoted.promoted_tweets.filter(t => t.status === 'completed').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Promoted Content</h1>
        <p className="text-sm text-gray-500 mt-1">Track promoted tweet performance and ROI</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Promoted" value={promoted.promoted_tweets.length} />
        <StatCard label="Active" value={active} />
        <StatCard label="Completed" value={completed} />
        <StatCard label="Budget Spent" value={`$${promoted.budget_spent.toFixed(2)}`} />
      </div>
      {promoted.promoted_tweets.length > 0 ? (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1e293b]">
              <th className="text-left p-4 text-gray-500 font-medium">Tweet ID</th>
              <th className="text-left p-4 text-gray-500 font-medium">Style</th>
              <th className="text-left p-4 text-gray-500 font-medium">Budget</th>
              <th className="text-left p-4 text-gray-500 font-medium">Status</th>
              <th className="text-left p-4 text-gray-500 font-medium">Engagement</th>
            </tr></thead>
            <tbody>
              {promoted.promoted_tweets.map((t) => (
                <tr key={t.tweet_id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/50">
                  <td className="p-4 text-gray-300 font-mono text-xs">{t.tweet_id.slice(0, 15)}...</td>
                  <td className="p-4 text-gray-300">{t.style || '-'}</td>
                  <td className="p-4 text-gray-300">${t.budget}</td>
                  <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{t.status}</span></td>
                  <td className="p-4 text-gray-300">{t.final_metrics ? t.final_metrics.likes + t.final_metrics.retweets + t.final_metrics.replies : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-10 text-center">
          <p className="text-gray-500 mb-2">No promoted content yet</p>
          <p className="text-xs text-gray-600">Use <code className="bg-[#1e293b] px-1.5 py-0.5 rounded text-gray-400">python main.py --promote TWEET_ID BUDGET</code> to tag a tweet</p>
        </div>
      )}
    </div>
  );
}
