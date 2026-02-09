import { Tweet, STYLE_COLORS, TweetStyle } from '@/lib/types';

export default function TweetCard({ tweet }: { tweet: Tweet }) {
  const color = STYLE_COLORS[tweet.style as TweetStyle] || '#6b7280';
  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '20', color }}>
            {tweet.style}
          </span>
          <span className="text-xs text-gray-500">Day {tweet.day}</span>
        </div>
        <span className="text-xs text-gray-600">{new Date(tweet.posted_at).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-gray-200 leading-relaxed">{tweet.text}</p>
      {tweet.metrics && (
        <div className="flex gap-5 mt-4 pt-3 border-t border-[#1e293b]">
          <MetricItem label="Likes" value={tweet.metrics.likes} />
          <MetricItem label="RTs" value={tweet.metrics.retweets} />
          <MetricItem label="Replies" value={tweet.metrics.replies} />
          <MetricItem label="Views" value={tweet.metrics.impressions} />
        </div>
      )}
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: number }) {
  const formatted = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-white">{formatted}</p>
    </div>
  );
}
