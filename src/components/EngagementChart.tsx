'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Tweet } from '@/lib/types';

export default function EngagementChart({ tweets }: { tweets: Tweet[] }) {
  const chartData = tweets
    .filter(t => t.metrics)
    .map(t => ({
      day: `Day ${t.day}`,
      likes: t.metrics!.likes,
      retweets: t.metrics!.retweets,
      replies: t.metrics!.replies,
    }));

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Engagement Over Time</h3>
      {chartData.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-10">No metrics data yet. Check back after a few days.</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" stroke="#334155" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
            <Line type="monotone" dataKey="likes" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            <Line type="monotone" dataKey="retweets" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            <Line type="monotone" dataKey="replies" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
