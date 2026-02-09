'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { STYLE_COLORS, TweetStyle } from '@/lib/types';

type Props = {
  data: Record<string, number>;
};

export default function StyleChart({ data }: Props) {
  const chartData = Object.entries(data).map(([style, score]) => ({
    style,
    score: Math.round(score * 10) / 10,
    color: STYLE_COLORS[style as TweetStyle] || '#6b7280',
  })).sort((a, b) => b.score - a.score);

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Style Performance</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 60 }}>
          <XAxis type="number" stroke="#334155" tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis type="category" dataKey="style" stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 12 }} width={70} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
