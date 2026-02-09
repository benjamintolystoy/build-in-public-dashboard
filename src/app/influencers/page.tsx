'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EngageItem } from '@/lib/types';

export default function EngagePage() {
  const [queue, setQueue] = useState<EngageItem[]>([]);
  const [tweetText, setTweetText] = useState('');
  const [author, setAuthor] = useState('');
  const [tweetUrl, setTweetUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/engage', { cache: 'no-store' });
      if (res.ok) setQueue(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleAdd = async () => {
    const trimmed = tweetText.trim();
    if (!trimmed || adding) return;

    setAdding(true);
    try {
      const res = await fetch('/api/engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweet_text: trimmed,
          author: author.trim(),
          tweet_url: tweetUrl.trim(),
        }),
      });
      if (res.ok) {
        const item: EngageItem = await res.json();
        setQueue((prev) => [item, ...prev]);
        setTweetText('');
        setAuthor('');
        setTweetUrl('');
        textareaRef.current?.focus();
      }
    } catch {
      /* silent */
    } finally {
      setAdding(false);
    }
  };

  const markStatus = async (id: string, status: 'done' | 'skipped') => {
    try {
      const res = await fetch('/api/engage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
      }
    } catch {
      /* silent */
    }
  };

  const copyReply = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(itemId + text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAdd();
    }
  };

  const pending = queue.filter((q) => q.status === 'pending');
  const done = queue.filter((q) => q.status === 'done');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Engage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Colle un tweet, reçois des suggestions de réponse style levelsio, copie et poste
        </p>
      </div>

      {/* Add tweet form */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 mb-8">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="@auteur"
            className="bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <input
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            placeholder="URL du tweet (optionnel)"
            className="bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <textarea
          ref={textareaRef}
          value={tweetText}
          onChange={(e) => setTweetText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Colle le texte du tweet ici..."
          rows={3}
          className="w-full bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
        />
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-600">
            <kbd className="bg-[#1e293b] px-1.5 py-0.5 rounded text-gray-400">⌘</kbd>
            {' + '}
            <kbd className="bg-[#1e293b] px-1.5 py-0.5 rounded text-gray-400">↵</kbd>
            {' pour générer'}
          </p>
          <button
            onClick={handleAdd}
            disabled={!tweetText.trim() || adding}
            type="button"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {adding ? 'Génération...' : 'Générer des réponses'}
          </button>
        </div>
      </div>

      {/* Pending queue */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-4">
          À répondre {pending.length > 0 && `(${pending.length})`}
        </h2>

        {!loaded ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-10 text-center">
            <p className="text-gray-500 mb-1">File vide</p>
            <p className="text-xs text-gray-600">Colle un tweet ci-dessus pour générer des suggestions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((item) => (
              <EngageCard
                key={item.id}
                item={item}
                copiedId={copiedId}
                onCopy={copyReply}
                onDone={() => markStatus(item.id, 'done')}
                onSkip={() => markStatus(item.id, 'skipped')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-4">Fait ({done.length})</h2>
          <div className="space-y-2">
            {done.map((item) => (
              <div
                key={item.id}
                className="bg-[#111827]/50 border border-[#1e293b] rounded-xl px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-green-500 text-xs">✓</span>
                  {item.author && (
                    <span className="text-xs text-blue-400 shrink-0">@{item.author}</span>
                  )}
                  <p className="text-xs text-gray-500 truncate">{item.tweet_text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type EngageCardProps = {
  item: EngageItem;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onDone: () => void;
  onSkip: () => void;
};

function EngageCard({ item, copiedId, onCopy, onDone, onSkip }: EngageCardProps) {
  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
      {/* Original tweet */}
      <div className="mb-4 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2 mb-2">
          {item.author && (
            <a
              href={`https://x.com/${item.author}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              @{item.author}
            </a>
          )}
          {item.tweet_url && (
            <a
              href={item.tweet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
            >
              ouvrir ↗
            </a>
          )}
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{item.tweet_text}</p>
      </div>

      {/* Suggestions */}
      <div className="space-y-2 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Suggestions de réponse</p>
        {item.suggestions.map((reply, i) => {
          const thisId = item.id + reply;
          const isCopied = copiedId === thisId;

          return (
            <div
              key={i}
              className="flex items-start gap-3 group"
            >
              <p className="flex-1 text-sm text-gray-200 bg-[#0a0e1a] rounded-lg px-4 py-2.5 border border-[#1e293b]">
                {reply}
              </p>
              <button
                onClick={() => onCopy(reply, item.id)}
                type="button"
                className={`shrink-0 px-3 py-2.5 text-xs font-medium rounded-lg transition-all ${
                  isCopied
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-[#1e293b] text-gray-400 hover:text-white hover:bg-[#334155]'
                }`}
              >
                {isCopied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onSkip}
          type="button"
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={onDone}
          type="button"
          className="px-4 py-1.5 text-xs font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors"
        >
          Fait ✓
        </button>
      </div>
    </div>
  );
}
