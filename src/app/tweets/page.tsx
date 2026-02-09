'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardData } from '@/lib/types';
import { fetchDashboardData } from '@/lib/api';
import TweetCard from '@/components/TweetCard';

const EngagementChart = dynamic(() => import('@/components/EngagementChart'), { ssr: false });

export default function TweetsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { fetchDashboardData().then(setData); }, []);
  if (!data) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const tweets = [...data.engagement.tweets].reverse();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tweets</h1>
        <p className="text-sm text-gray-500 mt-1">{tweets.length} tweets posted</p>
      </div>
      <div className="mb-8">
        <EngagementChart tweets={data.engagement.tweets} />
      </div>
      <div className="space-y-4">
        {tweets.map((tweet) => (
          <TweetCard key={tweet.tweet_id} tweet={tweet} />
        ))}
        {tweets.length === 0 && (
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-10 text-center">
            <p className="text-gray-500">No tweets posted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
