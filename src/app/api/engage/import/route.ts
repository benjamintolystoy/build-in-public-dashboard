import { NextResponse } from 'next/server';
import { generateReplies } from '@/lib/engage-engine';

type OembedResult = {
  author_name: string;
  author_url: string;
  html: string;
  url: string;
};

type ImportedTweet = {
  id: string;
  author: string;
  handle: string;
  tweet_text: string;
  tweet_url: string;
  tweet_id: string;
  suggestions: string[];
  created_at: string;
};

function extractTweetText(html: string): string {
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (!pMatch) return '';

  let text = pMatch[1];
  text = text.replace(/<a[^>]*>(.*?)<\/a>/g, '$1');
  text = text.replace(/<br\s*\/?>/g, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ');

  return text.trim();
}

function extractHandle(authorUrl: string): string {
  const match = authorUrl.match(/(?:x|twitter)\.com\/(\w+)/);
  return match ? match[1] : '';
}

function extractTweetId(url: string): string {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : '';
}

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (url.includes('twitter.com')) {
    url = url.replace('twitter.com', 'x.com');
  }
  // Remove query params and hash
  url = url.split('?')[0].split('#')[0];
  return url;
}

async function fetchTweet(rawUrl: string): Promise<ImportedTweet> {
  const url = normalizeUrl(rawUrl);
  const tweetId = extractTweetId(url);

  if (!tweetId) throw new Error(`Invalid tweet URL: ${rawUrl}`);

  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
  const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) });

  if (!res.ok) throw new Error(`oembed failed (${res.status})`);

  const data: OembedResult = await res.json();
  const handle = extractHandle(data.author_url);
  const tweetText = extractTweetText(data.html);

  if (!tweetText) throw new Error('Empty tweet text');

  const suggestions = generateReplies(tweetText, handle);

  return {
    id: `eng_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    author: data.author_name,
    handle,
    tweet_text: tweetText,
    tweet_url: url,
    tweet_id: tweetId,
    suggestions,
    created_at: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const urls: string[] = Array.isArray(body.urls) ? body.urls : [];

    const validUrls = urls
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter((u) => u && /status\/\d+/.test(u));

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: 'Aucune URL de tweet valide trouvée' },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(validUrls.map(fetchTweet));

    const items: ImportedTweet[] = [];
    let failed = 0;

    for (const r of results) {
      if (r.status === 'fulfilled') {
        items.push(r.value);
      } else {
        failed++;
      }
    }

    return NextResponse.json({ items, failed });
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }
}
