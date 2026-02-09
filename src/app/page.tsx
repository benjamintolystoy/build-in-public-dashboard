'use client';
import { useEffect, useState } from 'react';
import { DashboardData } from '@/lib/types';
import { fetchDashboardData } from '@/lib/api';
import StatCard from '@/components/StatCard';
import StyleChart from '@/components/StyleChart';
import TweetCard from '@/components/TweetCard';
import InteractionFeed from '@/components/InteractionFeed';

export default function OverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { fetchDashboardData().then(setData); }, []);
  if (!data) return <Loading />;

  const { engagement, interactions } = data;
  const totalEngagement = engagement.tweets.reduce((sum, t) => {
    if (!t.metrics) return sum;
    return sum + t.metrics.likes + t.metrics.retweets + t.metrics.replies;
  }, 0);
  const avgEngagement = engagement.tweets.length > 0 ? Math.round(totalEngagement / engagement.tweets.length) : 0;
  const latestTweet = engagement.tweets[engagement.tweets.length - 1];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Build In Public Agent — Day {engagement.day_counter}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Day" value={engagement.day_counter} subtitle="of the journey" />
        <StatCard label="Tweets Posted" value={engagement.tweets.length} />
        <StatCard label="Total Engagement" value={totalEngagement} />
        <StatCard label="Avg Engagement" value={avgEngagement} subtitle="per tweet" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <StyleChart data={engagement.style_scores} />
        <InteractionFeed interactions={interactions} />
      </div>
      {latestTweet && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Latest Tweet</h2>
          <TweetCard tweet={latestTweet} />
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );
}
