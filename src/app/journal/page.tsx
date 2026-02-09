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

const MAX_IMAGE_SIZE = 800;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
          const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas context'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal', { cache: 'no-store' });
      if (res.ok) setEntries(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addImages = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(isImageFile);
    if (imageFiles.length === 0) return;

    const resized = await Promise.all(imageFiles.map(resizeImage));
    setImages((prev) => [...prev, ...resized]);
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Paste handler (Cmd+V with screenshot)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length > 0) {
        e.preventDefault();
        addImages(files);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [addImages]);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (formRef.current && !formRef.current.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addImages(files);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if ((!trimmed && images.length === 0) || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, images }),
      });

      if (res.ok) {
        const entry: JournalEntry = await res.json();
        setEntries((prev) => [entry, ...prev]);
        setContent('');
        setImages([]);
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

  const hasContent = content.trim().length > 0 || images.length > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Journal</h1>
        <p className="text-sm text-gray-500 mt-1">
          Screenshots + notes rapides — ton agent s&apos;en sert pour générer du contenu
        </p>
      </div>

      <div
        ref={formRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-[#111827] border-2 rounded-xl p-5 mb-8 transition-colors ${
          dragging ? 'border-blue-500 bg-blue-500/5' : 'border-[#1e293b]'
        }`}
      >
        {dragging && (
          <div className="flex items-center justify-center py-8 text-blue-400 text-sm font-medium">
            Lâche ton screenshot ici
          </div>
        )}

        {!dragging && (
          <>
            <textarea
              ref={textareaRef}
              id="journal-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Note rapide (optionnel si tu mets un screenshot)..."
              rows={2}
              className="w-full bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
            />

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((src, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={src}
                      alt={`Screenshot ${i + 1}`}
                      className="h-24 rounded-lg border border-[#1e293b] object-cover"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      type="button"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Supprimer image ${i + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <span className="text-base">📷</span> Screenshot
                </button>
                <span className="text-xs text-gray-700">ou colle avec ⌘V</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Ajouter des images"
                />
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-600 hidden sm:block">
                  <kbd className="bg-[#1e293b] px-1.5 py-0.5 rounded text-gray-400">⌘</kbd>
                  {' + '}
                  <kbd className="bg-[#1e293b] px-1.5 py-0.5 rounded text-gray-400">↵</kbd>
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={!hasContent || sending}
                  type="button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {sending ? 'Envoi...' : 'Poster'}
                </button>
              </div>
            </div>
          </>
        )}
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
            <p className="text-xs text-gray-600">Drop un screenshot ou note ce que tu as fait</p>
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

                {entry.content && (
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                )}

                {entry.images && entry.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {entry.images.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                        <img
                          src={src}
                          alt={`Screenshot ${i + 1}`}
                          className="max-h-48 rounded-lg border border-[#1e293b] object-contain hover:border-blue-500 transition-colors cursor-zoom-in"
                        />
                      </a>
                    ))}
                  </div>
                )}
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
