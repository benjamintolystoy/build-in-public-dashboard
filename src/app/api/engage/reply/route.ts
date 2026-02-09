import { NextResponse } from 'next/server';
import { isXApiConfigured, postReply } from '@/lib/twitter';

export async function GET() {
  return NextResponse.json({ configured: isXApiConfigured() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tweetId = (body.tweet_id ?? '').trim();
    const text = (body.text ?? '').trim();

    if (!tweetId || !text) {
      return NextResponse.json(
        { success: false, error: 'tweet_id et text sont requis' },
        { status: 400 }
      );
    }

    const result = await postReply(tweetId, text);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Requête invalide' },
      { status: 400 }
    );
  }
}
