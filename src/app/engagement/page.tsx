'use client';
import { useEffect, useState } from 'react';
import { DashboardData } from '@/lib/types';
import { fetchDashboardData } from '@/lib/api';
import StatCard from '@/components/StatCard';
import StyleChart from '@/components/StyleChart';
import EngagementChart from '@/components/EngagementChart';
import InteractionFeed from '@/components/InteractionFeed';

export default function EngagementPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { fetchDashboardData().then(setData); }, []);
  if (!data) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const { engagement, interactions } = data;
  const totalLikes = interactions.filter(i => i.action === 'like').length;
  const totalReplies = interactions.filter(i => i.action === 'reply').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Engagement</h1>
        <p className="text-sm text-gray-500 mt-1">Tracking interactions and performance</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Interactions" value={interactions.length} />
        <StatCard label="Likes Given" value={totalLikes} />
        <StatCard label="Replies Sent" value={totalReplies} />
        <StatCard label="Styles Tracked" value={Object.keys(engagement.style_scores).length} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <StyleChart data={engagement.style_scores} />
        <EngagementChart tweets={engagement.tweets} />
      </div>
      <InteractionFeed interactions={interactions} />
    </div>
  );
}
