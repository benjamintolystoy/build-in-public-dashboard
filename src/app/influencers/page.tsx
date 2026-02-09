'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Local types ──

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

type ImportedItem = {
  id: string;
  author: string;
  handle: string;
  tweet_text: string;
  tweet_url: string;
  tweet_id: string;
  suggestions: string[];
  created_at: string;
};

const QUEUE_KEY = 'engage_queue_v2';
const ACCOUNTS_KEY = 'engage_accounts';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* silent */
  }
}

function toLocalItem(item: ImportedItem): LocalItem {
  return {
    ...item,
    suggestion_index: 0,
    edited_reply: item.suggestions[0] ?? '',
    status: 'pending',
  };
}

// ── Main page ──

export default function EngagePage() {
  const [queue, setQueue] = useState<LocalItem[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [newHandle, setNewHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);
  const [fetchErrors, setFetchErrors] = useState<string[]>([]);
  const [xConfigured, setXConfigured] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [urls, setUrls] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const handleInputRef = useRef<HTMLInputElement>(null);

  // ── Init ──

  useEffect(() => {
    setQueue(loadFromStorage<LocalItem[]>(QUEUE_KEY, []));
    setAccounts(loadFromStorage<string[]>(ACCOUNTS_KEY, []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveToStorage(QUEUE_KEY, queue);
  }, [queue, ready]);

  useEffect(() => {
    if (ready) saveToStorage(ACCOUNTS_KEY, accounts);
  }, [accounts, ready]);

  useEffect(() => {
    fetch('/api/engage/reply', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setXConfigured(d.configured))
      .catch(() => setXConfigured(false));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<LocalItem>) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }, []);

  // ── Account management ──

  const addAccount = () => {
    const clean = newHandle.trim().replace(/^@/, '').toLowerCase();
    if (!clean || accounts.includes(clean)) return;
    setAccounts((prev) => [...prev, clean]);
    setNewHandle('');
    handleInputRef.current?.focus();
  };

  const removeAccount = (handle: string) => {
    setAccounts((prev) => prev.filter((a) => a !== handle));
  };

  const handleAccountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAccount();
    }
  };

  // ── Auto-fetch tweets ──

  const fetchTweets = async () => {
    if (accounts.length === 0 || loading) return;

    setLoading(true);
    setFetchMsg(null);
    setFetchErrors([]);

    const seenIds = queue.map((q) => q.tweet_id);

    try {
      const res = await fetch('/api/engage/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handles: accounts, seen_ids: seenIds }),
      });

      const data = await res.json();
      const newItems: LocalItem[] = (data.items ?? []).map(toLocalItem);

      if (newItems.length > 0) {
        setQueue((prev) => [...newItems, ...prev]);
      }

      setFetchMsg(
        newItems.length > 0
          ? `${newItems.length} nouveau${newItems.length > 1 ? 'x' : ''} tweet${newItems.length > 1 ? 's' : ''} chargé${newItems.length > 1 ? 's' : ''}`
          : 'Aucun nouveau tweet'
      );

      if (data.errors?.length) {
        setFetchErrors(data.errors);
      }
    } catch {
      setFetchErrors(['Erreur réseau']);
    } finally {
      setLoading(false);
    }
  };

  // ── URL import fallback ──

  const handleUrlImport = async () => {
    const urlList = urls
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (urlList.length === 0 || importing) return;
    setImporting(true);
    setImportMsg(null);

    try {
      const res = await fetch('/api/engage/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      });

      if (!res.ok) {
        const err = await res.json();
        setImportMsg(err.error ?? 'Erreur');
        return;
      }

      const data = await res.json();
      const newItems: LocalItem[] = (data.items ?? []).map(toLocalItem);
      setQueue((prev) => [...newItems, ...prev]);
      setUrls('');
      const count = newItems.length;
      const fail = data.failed ?? 0;
      setImportMsg(
        `${count} importé${count > 1 ? 's' : ''}${fail > 0 ? ` · ${fail} échoué${fail > 1 ? 's' : ''}` : ''}`
      );
    } catch {
      setImportMsg('Erreur réseau');
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

  const clearDone = () => {
    setQueue((prev) => prev.filter((q) => q.status !== 'done' && q.status !== 'skipped'));
  };

  const pending = queue.filter(
    (q) => q.status === 'pending' || q.status === 'posting' || q.status === 'error'
  );
  const done = queue.filter((q) => q.status === 'done' || q.status === 'skipped');

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Engage</h1>
          <p className="text-sm text-gray-500 mt-1">
            Charge les tweets, valide les réponses, poste automatiquement
          </p>
        </div>
        <XApiBadge configured={xConfigured} />
      </div>

      {/* Accounts + Fetch */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Comptes suivis
          </p>
          <span className="text-[10px] text-gray-600">{accounts.length} compte{accounts.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Account chips */}
        {accounts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {accounts.map((handle) => (
              <span
                key={handle}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0a0e1a] border border-[#1e293b] rounded-full text-xs text-blue-400"
              >
                @{handle}
                <button
                  onClick={() => removeAccount(handle)}
                  type="button"
                  className="text-gray-600 hover:text-red-400 transition-colors"
                  aria-label={`Retirer @${handle}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add account */}
        <div className="flex gap-2 mb-4">
          <input
            ref={handleInputRef}
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            onKeyDown={handleAccountKeyDown}
            placeholder="@handle"
            className="flex-1 bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={addAccount}
            disabled={!newHandle.trim()}
            type="button"
            className="px-3 py-2 bg-[#1e293b] hover:bg-[#334155] disabled:opacity-40 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Ajouter
          </button>
        </div>

        {/* Fetch button */}
        <button
          onClick={fetchTweets}
          disabled={accounts.length === 0 || loading}
          type="button"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Chargement des tweets...
            </>
          ) : (
            `Charger les derniers tweets`
          )}
        </button>

        {/* Fetch result */}
        {fetchMsg && <p className="text-xs text-gray-400 mt-2 text-center">{fetchMsg}</p>}
        {fetchErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            {fetchErrors.map((err, i) => (
              <p key={i} className="text-xs text-red-400/80">{err}</p>
            ))}
          </div>
        )}
      </div>

      {/* URL import fallback */}
      <div className="mb-6">
        <button
          onClick={() => setShowUrlImport((p) => !p)}
          type="button"
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          {showUrlImport ? '▾ Masquer import par URL' : '▸ Import manuel par URL'}
        </button>

        {showUrlImport && (
          <div className="mt-3 bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <textarea
              value={urls}
              onChange={(e) => {
                setUrls(e.target.value);
                setImportMsg(null);
              }}
              placeholder={`https://x.com/levelsio/status/123456\nhttps://x.com/marc_louvion/status/789012`}
              rows={3}
              className="w-full bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none transition-colors font-mono"
            />
            <div className="flex justify-between items-center mt-2">
              {importMsg && <p className="text-xs text-gray-400">{importMsg}</p>}
              <button
                onClick={handleUrlImport}
                disabled={!urls.trim() || importing}
                type="button"
                className="ml-auto px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] disabled:opacity-40 text-gray-300 text-xs rounded-lg transition-colors"
              >
                {importing ? 'Import...' : 'Importer'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Queue */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-4">
          À valider {pending.length > 0 && `(${pending.length})`}
        </h2>

        {!ready ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-10 text-center">
            <p className="text-gray-500 mb-1">File vide</p>
            <p className="text-xs text-gray-600">
              {accounts.length === 0
                ? 'Ajoute des comptes ci-dessus pour commencer'
                : 'Clique sur "Charger les derniers tweets" pour remplir la file'}
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
                onCopy={() => navigator.clipboard.writeText(item.edited_reply)}
                onNext={() => handleNextSuggestion(item)}
                onSkip={() => updateItem(item.id, { status: 'skipped' })}
                onEdit={(text) => updateItem(item.id, { edited_reply: text })}
                onRetry={() => updateItem(item.id, { status: 'pending', error_message: undefined })}
              />
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {done.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-400">Historique ({done.length})</h2>
            <button onClick={clearDone} type="button" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Vider
            </button>
          </div>
          <div className="space-y-2">
            {done.map((item) => (
              <div key={item.id} className="bg-[#111827]/50 border border-[#1e293b] rounded-xl px-5 py-3 flex items-center gap-3">
                <span className={`text-xs shrink-0 ${item.status === 'done' ? 'text-green-500' : 'text-gray-600'}`}>
                  {item.status === 'done' ? '✓' : '—'}
                </span>
                {item.handle && <span className="text-xs text-blue-400 shrink-0">@{item.handle}</span>}
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

type XApiBadgeProps = { configured: boolean | null };

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
      {configured ? 'X API connectée' : 'X API non configurée'}
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

function QueueCard({ item, xConfigured, onPost, onCopy, onNext, onSkip, onEdit, onRetry }: QueueCardProps) {
  const [copied, setCopied] = useState(false);
  const isPosting = item.status === 'posting';
  const isError = item.status === 'error';

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-[#111827] border rounded-xl p-5 transition-colors ${isError ? 'border-red-500/40' : 'border-[#1e293b]'}`}>
      {/* Original tweet */}
      <div className="mb-4 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2 mb-2">
          {item.handle && (
            <a href={`https://x.com/${item.handle}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
              @{item.handle}
            </a>
          )}
          {item.tweet_url && (
            <a href={item.tweet_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
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
          <p className="text-[10px] text-gray-600">{item.suggestion_index + 1}/{item.suggestions.length}</p>
        </div>
        <textarea
          value={item.edited_reply}
          onChange={(e) => onEdit(e.target.value)}
          disabled={isPosting}
          rows={2}
          className="w-full bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors disabled:opacity-50"
        />
      </div>

      {/* Error */}
      {isError && item.error_message && (
        <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{item.error_message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onNext} disabled={isPosting} type="button" className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-colors disabled:opacity-50">
            Autre →
          </button>
          <button onClick={onSkip} disabled={isPosting} type="button" className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50">
            Passer
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isError && (
            <button onClick={onRetry} type="button" className="px-3 py-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
              Réessayer
            </button>
          )}

          <button
            onClick={handleCopy}
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-[#1e293b] text-gray-400 hover:text-white hover:bg-[#334155]'}`}
          >
            {copied ? '✓ Copié' : 'Copier'}
          </button>

          {xConfigured && (
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
          )}
        </div>
      </div>
    </div>
  );
}
