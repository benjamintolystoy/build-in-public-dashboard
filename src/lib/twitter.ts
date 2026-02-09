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
    return { success: false, error: 'X API non configurée. Ajoutez TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET dans les variables d\'environnement.' };
  }

  try {
    const result = await client.v2.reply(text, tweetId);
    return { success: true, tweet_id: result.data.id };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue';
    return { success: false, error: message };
  }
}
