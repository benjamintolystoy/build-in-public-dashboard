import { NextResponse } from 'next/server';
import { fetchUserTimeline, isXApiConfigured } from '@/lib/twitter';
import { generateReplies } from '@/lib/engage-engine';

type FetchedItem = {
  id: string;
  author: string;
  handle: string;
  tweet_text: string;
  tweet_url: string;
  tweet_id: string;
  suggestions: string[];
  created_at: string;
};

export async function POST(request: Request) {
  if (!isXApiConfigured()) {
    return NextResponse.json(
      {
        items: [],
        errors: [
          'X API non configurée. Ajoutez TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN et TWITTER_ACCESS_SECRET dans les variables d\'environnement Vercel.',
        ],
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const handles: string[] = Array.isArray(body.handles) ? body.handles : [];
    const seenIds: string[] = Array.isArray(body.seen_ids) ? body.seen_ids : [];
    const seenSet = new Set(seenIds);

    if (handles.length === 0) {
      return NextResponse.json(
        { items: [], errors: ['Aucun compte spécifié'] },
        { status: 400 }
      );
    }

    const items: FetchedItem[] = [];
    const errors: string[] = [];

    for (const handle of handles.slice(0, 15)) {
      try {
        const result = await fetchUserTimeline(handle, 5);

        for (const tweet of result.tweets) {
          if (seenSet.has(tweet.id)) continue;

          const suggestions = generateReplies(tweet.text, result.author.username);
          items.push({
            id: `eng_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            author: result.author.name,
            handle: result.author.username,
            tweet_text: tweet.text,
            tweet_url: `https://x.com/${result.author.username}/status/${tweet.id}`,
            tweet_id: tweet.id,
            suggestions,
            created_at: tweet.created_at,
          });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'erreur inconnue';
        if (msg.includes('403') || msg.includes('not permitted') || msg.includes('Forbidden')) {
          errors.push(
            'Accès refusé : ton plan API X ne permet pas de lire les timelines. Le plan Basic ($100/mois sur developer.x.com) est requis pour la lecture automatique.'
          );
          break;
        }
        errors.push(`@${handle.replace(/^@/, '')}: ${msg}`);
      }
    }

    return NextResponse.json({ items, errors });
  } catch {
    return NextResponse.json(
      { items: [], errors: ['Requête invalide'] },
      { status: 400 }
    );
  }
}
