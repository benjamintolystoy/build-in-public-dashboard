import { NextResponse } from 'next/server';
import { generateReplies } from '@/lib/engage-engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tweetText = (body.tweet_text ?? '').trim();
    const author = (body.author ?? '').trim().replace(/^@/, '');

    if (!tweetText) {
      return NextResponse.json({ error: 'tweet_text est requis' }, { status: 400 });
    }

    const suggestions = generateReplies(tweetText, author);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }
}
