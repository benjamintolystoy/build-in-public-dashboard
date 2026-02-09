'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Local types (client-side only) ──

type LocalItem = {
  id: string;
  author: string;
  handle: string;
  tweet_text: string;
  tweet_url: string;
  tweet_id: string;
  suggestions: string[];
  suggestion_index: number;
  edited_reply: string;
  status: 'pending' | 'posting' | 'done' | 'skipped' | 'error';
  error_message?: string;
  created_at: string;
};

const STORAGE_KEY = 'engage_queue_v2';

function loadQueue(): LocalItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(items: LocalItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded — silent */
  }
}

// ── Main page ──

export default function EngagePage() {
  const [queue, setQueue] = useState<LocalItem[]>([]);
  const [urls, setUrls] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [xConfigured, setXConfigured] = useState<boolean | null>(null);
  const [loaded, setLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setQueue(loadQueue());
    setLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (loaded) saveQueue(queue);
  }, [queue, loaded]);

  // Check X API config
  useEffect(() => {
    fetch('/api/engage/reply', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setXConfigured(d.configured))
      .catch(() => setXConfigured(false));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<LocalItem>) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }, []);

  // ── Import tweets from URLs ──

  const handleImport = async () => {
    const urlList = urls
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (urlList.length === 0 || importing) return;

    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/engage/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      });

      if (!res.ok) {
        const err = await res.json();
        setImportResult(err.error ?? 'Erreur lors de l\'import');
        return;
      }

      const data = await res.json();
      const newItems: LocalItem[] = data.items.map(
        (item: {
          id: string;
          author: string;
          handle: string;
          tweet_text: string;
          tweet_url: string;
          tweet_id: string;
          suggestions: string[];
          created_at: string;
        }) => ({
          ...item,
          suggestion_index: 0,
          edited_reply: item.suggestions[0] ?? '',
          status: 'pending' as const,
        })
      );

      setQueue((prev) => [...newItems, ...prev]);
      setUrls('');

      const msg =
        newItems.length > 0
          ? `${newItems.length} tweet${newItems.length > 1 ? 's' : ''} importé${newItems.length > 1 ? 's' : ''}`
          : '';
      const failMsg = data.failed > 0 ? ` · ${data.failed} échoué${data.failed > 1 ? 's' : ''}` : '';
      setImportResult(`${msg}${failMsg}`);
    } catch {
      setImportResult('Erreur réseau');
    } finally {
      setImporting(false);
    }
  };

  // ── Post reply ──

  const handlePost = async (item: LocalItem) => {
    const text = item.edited_reply.trim();
    if (!text || !item.tweet_id) return;

    updateItem(item.id, { status: 'posting', error_message: undefined });

    try {
      const res = await fetch('/api/engage/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet_id: item.tweet_id, text }),
      });

      const result = await res.json();

      if (result.success) {
        updateItem(item.id, { status: 'done' });
      } else {
        updateItem(item.id, { status: 'error', error_message: result.error });
      }
    } catch {
      updateItem(item.id, { status: 'error', error_message: 'Erreur réseau' });
    }
  };

  // ── Cycle suggestion ──

  const handleNextSuggestion = useCallback(
    async (item: LocalItem) => {
      const nextIndex = item.suggestion_index + 1;

      if (nextIndex < item.suggestions.length) {
        updateItem(item.id, {
          suggestion_index: nextIndex,
          edited_reply: item.suggestions[nextIndex],
        });
        return;
      }

      // Regenerate from API
      try {
        const res = await fetch('/api/engage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tweet_text: item.tweet_text, author: item.handle }),
        });
        const data = await res.json();
        if (data.suggestions?.length) {
          updateItem(item.id, {
            suggestions: data.suggestions,
            suggestion_index: 0,
            edited_reply: data.suggestions[0],
          });
        }
      } catch {
        /* silent */
      }
    },
    [updateItem]
  );

  // ── Copy to clipboard ──

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // ── Clear done ──

  const clearDone = () => {
    setQueue((prev) => prev.filter((q) => q.status !== 'done' && q.status !== 'skipped'));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleImport();
    }
  };

  const pending = queue.filter(
    (q) => q.status === 'pending' || q.status === 'posting' || q.status === 'error'
  );
  const done = queue.filter((q) => q.status === 'done' || q.status === 'skipped');
  const urlCount = urls
    .split(/[\n,]+/)
    .filter((u) => u.trim() && /status\/\d+/.test(u)).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Engage</h1>
          <p className="text-sm text-gray-500 mt-1">
            Importe des tweets → valide les réponses → poste en un clic
          </p>
        </div>
        <XApiBadge configured={xConfigured} />
      </div>

      {/* Import section */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 mb-8">
        <label htmlFor="tweet-urls" className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">
          URLs de tweets (1 par ligne)
        </label>
        <textarea
          id="tweet-urls"
          ref={textareaRef}
          value={urls}
          onChange={(e) => {
            setUrls(e.target.value);
            setImportResult(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={`https://x.com/levelsio/status/123456\nhttps://x.com/marc_louvion/status/789012\nhttps://x.com/tdinh_me/status/345678`}
          rows={4}
          className="w-full bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors font-mono"
        />
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-600">
              <kbd className="bg-[#1e293b] px-1.5 py-0.5 rounded text-gray-400">⌘</kbd>
              {' + '}
              <kbd className="bg-[#1e293b] px-1.5 py-0.5 rounded text-gray-400">↵</kbd>
            </p>
            {importResult && (
              <p className="text-xs text-gray-400">{importResult}</p>
            )}
          </div>
          <button
            onClick={handleImport}
            disabled={urlCount === 0 || importing}
            type="button"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {importing
              ? 'Import en cours...'
              : `Importer${urlCount > 0 ? ` ${urlCount} tweet${urlCount > 1 ? 's' : ''}` : ''}`}
          </button>
        </div>
      </div>

      {/* Queue */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-4">
          À valider {pending.length > 0 && `(${pending.length})`}
        </h2>

        {!loaded ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-10 text-center">
            <p className="text-gray-500 mb-1">File vide</p>
            <p className="text-xs text-gray-600">
              Colle des URLs de tweets ci-dessus pour commencer
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                xConfigured={xConfigured === true}
                onPost={() => handlePost(item)}
                onCopy={() => handleCopy(item.edited_reply)}
                onNext={() => handleNextSuggestion(item)}
                onSkip={() => updateItem(item.id, { status: 'skipped' })}
                onEdit={(text) => updateItem(item.id, { edited_reply: text })}
                onRetry={() => updateItem(item.id, { status: 'pending', error_message: undefined })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-400">
              Historique ({done.length})
            </h2>
            <button
              onClick={clearDone}
              type="button"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Vider
            </button>
          </div>
          <div className="space-y-2">
            {done.map((item) => (
              <div
                key={item.id}
                className="bg-[#111827]/50 border border-[#1e293b] rounded-xl px-5 py-3 flex items-center gap-3"
              >
                <span
                  className={`text-xs shrink-0 ${item.status === 'done' ? 'text-green-500' : 'text-gray-600'}`}
                >
                  {item.status === 'done' ? '✓' : '—'}
                </span>
                {item.handle && (
                  <span className="text-xs text-blue-400 shrink-0">@{item.handle}</span>
                )}
                <p className="text-xs text-gray-500 truncate flex-1">{item.tweet_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

type XApiBadgeProps = {
  configured: boolean | null;
};

function XApiBadge({ configured }: XApiBadgeProps) {
  if (configured === null) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        configured
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-green-400' : 'bg-yellow-400'}`} />
      {configured ? 'X API connectée' : 'Mode copie (X API non configurée)'}
    </div>
  );
}

type QueueCardProps = {
  item: LocalItem;
  xConfigured: boolean;
  onPost: () => void;
  onCopy: () => void;
  onNext: () => void;
  onSkip: () => void;
  onEdit: (text: string) => void;
  onRetry: () => void;
};

function QueueCard({
  item,
  xConfigured,
  onPost,
  onCopy,
  onNext,
  onSkip,
  onEdit,
  onRetry,
}: QueueCardProps) {
  const [copied, setCopied] = useState(false);
  const isPosting = item.status === 'posting';
  const isError = item.status === 'error';

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-[#111827] border rounded-xl p-5 transition-colors ${
        isError ? 'border-red-500/40' : 'border-[#1e293b]'
      }`}
    >
      {/* Original tweet */}
      <div className="mb-4 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2 mb-2">
          {item.handle && (
            <a
              href={`https://x.com/${item.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              @{item.handle}
            </a>
          )}
          {item.author && item.author !== item.handle && (
            <span className="text-xs text-gray-600">{item.author}</span>
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

      {/* Editable reply */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Ta réponse</p>
          <p className="text-[10px] text-gray-600">
            {item.suggestion_index + 1}/{item.suggestions.length}
          </p>
        </div>
        <textarea
          value={item.edited_reply}
          onChange={(e) => onEdit(e.target.value)}
          disabled={isPosting}
          rows={2}
          className="w-full bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors disabled:opacity-50"
        />
      </div>

      {/* Error message */}
      {isError && item.error_message && (
        <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{item.error_message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onNext}
            disabled={isPosting}
            type="button"
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-colors disabled:opacity-50"
          >
            Autre suggestion →
          </button>
          <button
            onClick={onSkip}
            disabled={isPosting}
            type="button"
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            Passer
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isError && (
            <button
              onClick={onRetry}
              type="button"
              className="px-3 py-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Réessayer
            </button>
          )}

          <button
            onClick={handleCopy}
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-[#1e293b] text-gray-400 hover:text-white hover:bg-[#334155]'
            }`}
          >
            {copied ? '✓ Copié' : 'Copier'}
          </button>

          {xConfigured ? (
            <button
              onClick={onPost}
              disabled={isPosting || !item.edited_reply.trim()}
              type="button"
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
            >
              {isPosting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi...
                </span>
              ) : (
                'Poster ✓'
              )}
            </button>
          ) : (
            <button
              onClick={handleCopy}
              type="button"
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {copied ? '✓ Copié' : 'Copier pour poster'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
