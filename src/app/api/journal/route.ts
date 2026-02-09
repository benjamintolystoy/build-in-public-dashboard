import { NextResponse } from 'next/server';
import { JournalEntry } from '@/lib/types';

const entries: JournalEntry[] = [];

export async function GET() {
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const content = (body.content ?? '').trim();
    const images: string[] = Array.isArray(body.images) ? body.images : [];

    if (!content && images.length === 0) {
      return NextResponse.json({ error: 'content or images required' }, { status: 400 });
    }

    const tags: string[] = Array.isArray(body.tags) ? body.tags : extractTags(content);

    const entry: JournalEntry = {
      id: `j_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content,
      images,
      tags,
      created_at: new Date().toISOString(),
    };

    entries.unshift(entry);

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

function extractTags(text: string): string[] {
  const tagMap: Record<string, string[]> = {
    ship: ['shipped', 'deployed', 'launched', 'released', 'pushed', 'live'],
    build: ['built', 'created', 'coded', 'developed', 'implemented', 'added'],
    fix: ['fixed', 'resolved', 'debugged', 'patched', 'corrected'],
    learn: ['learned', 'discovered', 'realized', 'understood', 'figured'],
    growth: ['followers', 'impressions', 'engagement', 'views', 'likes', 'viral'],
    idea: ['idea', 'thinking', 'planning', 'strategy', 'brainstorm'],
    revenue: ['revenue', 'money', 'sales', 'paid', 'mrr', 'arr', '$'],
  };

  const lower = text.toLowerCase();
  return Object.entries(tagMap)
    .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
    .map(([tag]) => tag);
}
