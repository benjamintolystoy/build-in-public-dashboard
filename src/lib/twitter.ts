import { TwitterApi } from 'twitter-api-v2';

function getClient(): TwitterApi | null {
  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) return null;

  return new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
}

export function isXApiConfigured(): boolean {
  return getClient() !== null;
}

export async function postReply(
  tweetId: string,
  text: string
): Promise<{ success: boolean; tweet_id?: string; error?: string }> {
  const client = getClient();
  if (!client) {
    return {
      success: false,
      error:
        'X API non configurée. Ajoutez TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET.',
    };
  }

  try {
    const result = await client.v2.reply(text, tweetId);
    return { success: true, tweet_id: result.data.id };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue';
    return { success: false, error: message };
  }
}

export type FetchedTweet = {
  id: string;
  text: string;
  created_at: string;
};

export type FetchedUser = {
  name: string;
  username: string;
};

export async function fetchUserTimeline(
  handle: string,
  maxResults = 10
): Promise<{ tweets: FetchedTweet[]; author: FetchedUser }> {
  const client = getClient();
  if (!client) throw new Error('X API non configurée');

  const cleanHandle = handle.replace(/^@/, '');
  const userResult = await client.v2.userByUsername(cleanHandle);

  if (!userResult.data) {
    throw new Error(`@${cleanHandle} introuvable`);
  }

  const timeline = await client.v2.userTimeline(userResult.data.id, {
    max_results: maxResults,
    exclude: ['replies', 'retweets'],
    'tweet.fields': ['created_at'],
  });

  const tweets: FetchedTweet[] = (timeline.data.data ?? []).map((t) => ({
    id: t.id,
    text: t.text,
    created_at: t.created_at ?? new Date().toISOString(),
  }));

  return {
    tweets,
    author: {
      name: userResult.data.name,
      username: userResult.data.username,
    },
  };
}
