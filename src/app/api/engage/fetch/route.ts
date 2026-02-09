import { NextResponse } from 'next/server';
import { generateReplies } from '@/lib/engage-engine';

// ── Syndication scraper (free, no auth) ──

type SyndicationTweet = {
  id_str: string;
  text: string;
  created_at: string;
  favorite_count: number;
  reply_count: number;
  retweet_count: number;
  user: {
    name: string;
    screen_name: string;
  };
};

type SyndicationEntry = {
  type: string;
  content: {
    tweet: SyndicationTweet;
  };
};

type SyndicationData = {
  props: {
    pageProps: {
      timeline: {
        entries: SyndicationEntry[];
      };
    };
  };
};

type FetchedItem = {
  id: string;
  author: string;
  handle: string;
  tweet_text: string;
  tweet_url: string;
  tweet_id: string;
  suggestions: string[];
  created_at: string;
  metrics: {
    likes: number;
    replies: number;
    retweets: number;
  };
};

async function scrapeTweets(handle: string, limit: number): Promise<FetchedItem[]> {
  const cleanHandle = handle.replace(/^@/, '');
  const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${cleanHandle}?showReplies=false`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status} pour @${cleanHandle}`);
  }

  const html = await res.text();

  // Extract __NEXT_DATA__ JSON
  const jsonMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!jsonMatch?.[1]) {
    throw new Error(`Impossible de parser les tweets de @${cleanHandle}`);
  }

  const data: SyndicationData = JSON.parse(jsonMatch[1]);
  const entries = data.props?.pageProps?.timeline?.entries ?? [];

  const items: FetchedItem[] = [];

  for (const entry of entries) {
    if (entry.type !== 'tweet') continue;

    const tweet = entry.content?.tweet;
    if (!tweet?.text || !tweet?.id_str) continue;

    const suggestions = generateReplies(tweet.text, tweet.user?.screen_name ?? cleanHandle);

    items.push({
      id: `eng_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      author: tweet.user?.name ?? cleanHandle,
      handle: tweet.user?.screen_name ?? cleanHandle,
      tweet_text: tweet.text,
      tweet_url: `https://x.com/${tweet.user?.screen_name ?? cleanHandle}/status/${tweet.id_str}`,
      tweet_id: tweet.id_str,
      suggestions,
      created_at: tweet.created_at,
      metrics: {
        likes: tweet.favorite_count ?? 0,
        replies: tweet.reply_count ?? 0,
        retweets: tweet.retweet_count ?? 0,
      },
    });

    if (items.length >= limit) break;
  }

  return items;
}

// ── Route handler ──

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const handles: string[] = Array.isArray(body.handles) ? body.handles : [];
    const seenIds: string[] = Array.isArray(body.seen_ids) ? body.seen_ids : [];
    const perAccount: number = typeof body.per_account === 'number' ? body.per_account : 5;
    const seenSet = new Set(seenIds);

    if (handles.length === 0) {
      return NextResponse.json(
        { items: [], errors: ['Aucun compte spécifié'] },
        { status: 400 }
      );
    }

    const allItems: FetchedItem[] = [];
    const errors: string[] = [];

    for (const handle of handles.slice(0, 20)) {
      try {
        const tweets = await scrapeTweets(handle, perAccount + seenIds.length);
        const fresh = tweets.filter((t) => !seenSet.has(t.tweet_id)).slice(0, perAccount);
        allItems.push(...fresh);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'erreur inconnue';
        errors.push(`@${handle.replace(/^@/, '')}: ${msg}`);
      }
    }

    return NextResponse.json({ items: allItems, errors });
  } catch {
    return NextResponse.json(
      { items: [], errors: ['Requête invalide'] },
      { status: 400 }
    );
  }
}
