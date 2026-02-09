'use client';

import { STYLE_COLORS, STYLE_LABELS, TweetStyle } from '@/lib/types';

type Props = {
  data: Record<string, number>;
};

export default function StyleChart({ data }: Props) {
  const entries = Object.entries(data)
    .map(([style, score]) => ({
      style,
      label: STYLE_LABELS[style as TweetStyle] || style,
      score: Math.round(score * 10) / 10,
      color: STYLE_COLORS[style as TweetStyle] || '#6b7280',
    }))
    .sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...entries.map((e) => e.score), 1);

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Style Performance</h3>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.style} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-20 text-right shrink-0">{entry.label}</span>
            <div className="flex-1 h-6 bg-[#1e293b] rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${(entry.score / maxScore) * 100}%`,
                  backgroundColor: entry.color,
                }}
              />
            </div>
            <span className="text-xs font-medium text-gray-300 w-10 text-right tabular-nums">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
