type ReplyPattern = {
  match: (text: string) => boolean;
  replies: ((text: string, author: string) => string)[];
};

const PATTERNS: ReplyPattern[] = [
  {
    match: (t) => /launch|shipped|deployed|released|live|just built/i.test(t),
    replies: [
      () => 'congrats on shipping! what\'s the stack?',
      () => 'nice. how long did it take to build?',
      (_t, a) => `love seeing ${a ? '@' + a : 'people'} actually shipping. most just talk about it`,
      () => 'ship fast, fix later. this is the way',
      () => 'what was the hardest part to build?',
      () => 'this looks great. what\'s the next feature?',
    ],
  },
  {
    match: (t) => /revenue|mrr|arr|\$\d|income|money|profit|paying/i.test(t),
    replies: [
      () => 'solid. what\'s the main acquisition channel?',
      () => 'nice numbers. are you a solo founder?',
      () => 'what took you the longest - building or finding users?',
      () => 'love the transparency. more founders should share numbers',
      () => 'how long from first line of code to first dollar?',
      () => 'what\'s your churn rate looking like?',
    ],
  },
  {
    match: (t) => /\bai\b|gpt|llm|claude|openai|agent|machine learning/i.test(t),
    replies: [
      () => 'AI is eating software. what model are you using?',
      () => 'interesting use case. how do you handle hallucinations?',
      () => 'the best AI products are the ones where users don\'t even notice it\'s AI',
      () => 'what\'s your cost per API call roughly?',
      () => 'have you tried running it locally? way cheaper',
      () => 'the wrapper vs real AI product debate is overblown. if it solves a problem, ship it',
    ],
  },
  {
    match: (t) => /fail|mistake|lost|broke|down|bug|crash/i.test(t),
    replies: [
      () => 'happens to everyone. what did you learn from it?',
      () => 'the best founders fail fast and recover faster',
      () => 'I\'ve been there. the comeback is always better than the setback',
      () => 'at least you\'re building. most people are just watching',
      () => 'ship the fix and move on. nobody remembers the bugs',
    ],
  },
  {
    match: (t) => /user|customer|feedback|growth|sign.?up|waitlist/i.test(t),
    replies: [
      () => 'where are your users coming from mainly?',
      () => 'talk to your users every day. best growth hack there is',
      () => 'what\'s your retention like?',
      () => 'early users are gold. treat them well',
      () => 'how did you get your first 10 users?',
      () => 'organic or paid acquisition?',
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
  {
    match: (t) => /nomad|remote|travel|country|thailand|bali|lisbon/i.test(t),
    replies: [
      () => 'the nomad life is the best life. where are you based now?',
      () => 'what\'s your wifi/productivity setup on the road?',
      () => 'best place to code is a cafe with good wifi in SEA',
      () => 'how do you handle timezones with clients/users?',
    ],
  },
  {
    match: (t) => /open.?source|github|repo|star/i.test(t),
    replies: [
      () => 'love open source. what\'s the repo?',
      () => 'open source is the ultimate moat. community > everything',
      () => 'how do you monetize while keeping it open source?',
      () => 'starring this right now',
    ],
  },
];

const GENERIC_REPLIES = [
  () => 'interesting. tell me more about this',
  (_t: string, a: string) => `good stuff ${a ? '@' + a : ''}. keep shipping`.trim(),
  () => 'this is the kind of content I like seeing on my feed',
  () => 'bookmarked. following your journey',
  () => 'respect the hustle. keep building',
  () => 'how long have you been working on this?',
  () => 'what\'s the next milestone?',
  () => 'love the build in public approach',
  () => 'this is it. keep going',
  () => 'saving this for later. solid thread',
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateReplies(tweetText: string, author: string): string[] {
  const matched: string[] = [];

  for (const pattern of PATTERNS) {
    if (pattern.match(tweetText)) {
      const picked = shuffle(pattern.replies).slice(0, 2);
      for (const fn of picked) {
        matched.push(fn(tweetText, author));
      }
    }
  }

  const generic = shuffle(GENERIC_REPLIES).slice(0, 2);
  for (const fn of generic) {
    matched.push(fn(tweetText, author));
  }

  return Array.from(new Set(matched)).slice(0, 4);
}
