import { Interaction } from '@/lib/types';

export default function InteractionFeed({ interactions }: { interactions: Interaction[] }) {
  const recent = interactions.slice(-15).reverse();
  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Recent Interactions</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-6">No interactions yet.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {recent.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className={`mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                item.action === 'like' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {item.action === 'like' ? '♥' : '↩'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 truncate">{item.details || `Liked tweet ${item.tweet_id.slice(0, 10)}...`}</p>
                <p className="text-xs text-gray-600">{new Date(item.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
