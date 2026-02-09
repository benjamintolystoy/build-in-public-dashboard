import { NextResponse } from 'next/server';
import { EngageItem } from '@/lib/types';

const queue: EngageItem[] = [];

export async function GET() {
  return NextResponse.json(queue);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tweetText = (body.tweet_text ?? '').trim();
    const author = (body.author ?? '').trim().replace(/^@/, '');
    const tweetUrl = (body.tweet_url ?? '').trim();

    if (!tweetText) {
      return NextResponse.json({ error: 'tweet_text is required' }, { status: 400 });
    }

    const suggestions = generateLevelsioReplies(tweetText, author);

    const item: EngageItem = {
      id: `eng_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      author,
      tweet_text: tweetText,
      tweet_url: tweetUrl,
      suggestions,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    queue.unshift(item);

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    const item = queue.find((q) => q.id === id);
    if (!item) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (status === 'done' || status === 'skipped') item.status = status;
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

// ── Reply generation engine (levelsio style) ──

type ReplyPattern = {
  match: (text: string) => boolean;
  replies: ((text: string, author: string) => string)[];
};

const PATTERNS: ReplyPattern[] = [
  {
    match: (t) => /launch|shipped|deployed|released|live/i.test(t),
    replies: [
      () => 'congrats on shipping! what\'s the stack?',
      () => 'nice. how long did it take to build?',
      (_t, a) => `love seeing ${a ? '@' + a : 'people'} actually shipping. most just talk about it`,
      () => 'ship fast, fix later. this is the way',
      () => 'what was the hardest part to build?',
    ],
  },
  {
    match: (t) => /revenue|mrr|arr|\$|income|money|profit/i.test(t),
    replies: [
      () => 'solid. what\'s the main acquisition channel?',
      () => 'nice numbers. are you a solo founder?',
      () => 'what took you the longest - building or finding users?',
      () => 'love the transparency. more founders should share numbers',
      () => 'how long from first line of code to first dollar?',
    ],
  },
  {
    match: (t) => /ai|gpt|llm|claude|openai|agent/i.test(t),
    replies: [
      () => 'AI is eating software. what model are you using?',
      () => 'interesting use case. how do you handle hallucinations?',
      () => 'the best AI products are the ones where users don\'t even notice it\'s AI',
      () => 'what\'s your cost per API call roughly?',
      () => 'have you tried running it locally? way cheaper',
    ],
  },
  {
    match: (t) => /fail|mistake|lost|broke|down|bug/i.test(t),
    replies: [
      () => 'happens to everyone. what did you learn from it?',
      () => 'the best founders fail fast and recover faster',
      () => 'I\'ve been there. the comeback is always better than the setback',
      () => 'at least you\'re building. most people are just watching',
      () => 'ship the fix and move on. nobody remembers the bugs',
    ],
  },
  {
    match: (t) => /user|customer|feedback|growth|sign.?up/i.test(t),
    replies: [
      () => 'where are your users coming from mainly?',
      () => 'talk to your users every day. best growth hack there is',
      () => 'what\'s your retention like?',
      () => 'early users are gold. treat them well',
      () => 'how did you get your first 10 users?',
    ],
  },
  {
    match: (t) => /build.?in.?public|indie|solo|bootstrap/i.test(t),
    replies: [
      () => 'building in public is a superpower. keep going',
      () => 'the best marketing is showing your work',
      () => 'solo founders are underrated. you move 10x faster',
      () => 'bootstrapping > raising money for 99% of products',
      () => 'love this. day 1 energy is the best energy',
    ],
  },
  {
    match: (t) => /design|ui|ux|landing|page|website/i.test(t),
    replies: [
      () => 'clean design. what tools did you use?',
      () => 'looks solid. does it convert well?',
      () => 'simple > fancy. every time',
      () => 'the best landing pages are the ones you can read in 5 seconds',
      () => 'tailwind?',
    ],
  },
];

const GENERIC_REPLIES = [
  () => 'interesting. tell me more about this',
  (_t: string, a: string) => `good stuff ${a ? '@' + a : ''}. keep shipping`,
  () => 'this is the kind of content I like seeing on my feed',
  () => 'bookmarked. following your journey',
  () => 'respect the hustle. keep building',
  () => 'how long have you been working on this?',
  () => 'what\'s the next milestone?',
  () => 'love the build in public approach',
];

function generateLevelsioReplies(tweetText: string, author: string): string[] {
  const matched: string[] = [];

  for (const pattern of PATTERNS) {
    if (pattern.match(tweetText)) {
      const shuffled = [...pattern.replies].sort(() => Math.random() - 0.5);
      for (const fn of shuffled.slice(0, 2)) {
        matched.push(fn(tweetText, author));
      }
    }
  }

  const genericShuffled = [...GENERIC_REPLIES].sort(() => Math.random() - 0.5);
  for (const fn of genericShuffled.slice(0, 2)) {
    matched.push(fn(tweetText, author));
  }

  // Dedupe and return max 4
  return Array.from(new Set(matched)).slice(0, 4);
}
