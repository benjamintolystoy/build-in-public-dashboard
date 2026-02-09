'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { JournalEntry } from '@/lib/types';

const TAG_COLORS: Record<string, string> = {
  ship: '#10b981',
  build: '#3b82f6',
  fix: '#f59e0b',
  learn: '#8b5cf6',
  growth: '#ec4899',
  idea: '#06b6d4',
  revenue: '#22c55e',
};

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      /* silent */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });

      if (res.ok) {
        const entry: JournalEntry = await res.json();
        setEntries((prev) => [entry, ...prev]);
        setContent('');
        textareaRef.current?.focus();
      }
    } catch {
      /* silent */
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Journal</h1>
        <p className="text-sm text-gray-500 mt-1">
          Note tes avancées du jour — ton agent les utilisera pour générer du contenu
        </p>
      </div>

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 mb-8">
        <label htmlFor="journal-input" className="text-sm font-medium text-gray-400 block mb-3">
          Qu&apos;est-ce que tu as fait aujourd&apos;hui ?
        </label>
        <textarea
          ref={textareaRef}
          id="journal-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: J'ai déployé le dashboard, corrigé le bug Recharts, et lancé mon premier tweet build in public..."
          rows={4}
          className="w-full bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-600">
            <kbd className="bg-[#1e293b] px-1.5 py-0.5 rounded text-gray-400">⌘</kbd>
            {' + '}
            <kbd className="bg-[#1e293b] px-1.5 py-0.5 rounded text-gray-400">Enter</kbd>
            {' pour envoyer'}
          </p>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || sending}
            type="button"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {sending ? 'Envoi...' : 'Ajouter'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-4">
          Historique {entries.length > 0 && `(${entries.length})`}
        </h2>

        {!loaded ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-10 text-center">
            <p className="text-gray-500 mb-1">Aucune entrée pour le moment</p>
            <p className="text-xs text-gray-600">Commence à documenter tes avancées ci-dessus</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: (TAG_COLORS[tag] ?? '#6b7280') + '20',
                          color: TAG_COLORS[tag] ?? '#6b7280',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <time className="text-xs text-gray-600 shrink-0">
                    {formatDate(entry.created_at)}
                  </time>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;

  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
