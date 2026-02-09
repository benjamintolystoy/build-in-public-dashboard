'use client';

import { Tweet } from '@/lib/types';

type Props = {
  tweets: Tweet[];
};

export default function EngagementChart({ tweets }: Props) {
  const chartData = tweets
    .filter((t) => t.metrics)
    .map((t) => ({
      day: t.day,
      likes: t.metrics!.likes,
      retweets: t.metrics!.retweets,
      replies: t.metrics!.replies,
      total: t.metrics!.likes + t.metrics!.retweets + t.metrics!.replies,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Engagement Over Time</h3>
        <p className="text-sm text-gray-600 text-center py-10">No metrics data yet. Check back after a few days.</p>
      </div>
    );
  }

  const maxTotal = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Engagement Over Time</h3>

      <div className="flex items-end gap-1 h-48 px-2">
        {chartData.map((d) => {
          const likesHeight = (d.likes / maxTotal) * 100;
          const retweetsHeight = (d.retweets / maxTotal) * 100;
          const repliesHeight = (d.replies / maxTotal) * 100;

          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div className="w-full flex flex-col justify-end h-40">
                <div
                  className="w-full rounded-t-sm bg-[#3b82f6] transition-all duration-300"
                  style={{ height: `${likesHeight}%` }}
                  title={`Likes: ${d.likes}`}
                />
                <div
                  className="w-full bg-[#10b981] transition-all duration-300"
                  style={{ height: `${retweetsHeight}%` }}
                  title={`RTs: ${d.retweets}`}
                />
                <div
                  className="w-full rounded-b-sm bg-[#f59e0b] transition-all duration-300"
                  style={{ height: `${repliesHeight}%` }}
                  title={`Replies: ${d.replies}`}
                />
              </div>
              <span className="text-[10px] text-gray-600 mt-1">D{d.day}</span>

              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-[10px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                L:{d.likes} RT:{d.retweets} R:{d.replies}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-[#1e293b]">
        <LegendItem color="#3b82f6" label="Likes" />
        <LegendItem color="#10b981" label="Retweets" />
        <LegendItem color="#f59e0b" label="Replies" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
