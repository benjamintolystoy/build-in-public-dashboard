import { DashboardData } from './types';

export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (!res.ok) throw new Error('failed');
    return res.json();
  } catch {
    return getDemoData();
  }
}

export function getDemoData(): DashboardData {
  return {
    engagement: {
      tweets: [
        { tweet_id: '2020826988521345167', text: 'day 1. building a $100k/mo e-commerce brand run entirely by AI. no team. no office. just agents shipping product, content, and code. documenting everything here.', style: 'levelsio', day: 1, posted_at: '2026-02-09T12:00:00Z', metrics: { likes: 1, retweets: 0, replies: 0, impressions: 20, quotes: 0 }, metrics_fetched_at: '2026-02-09T15:50:00Z' },
      ],
      day_counter: 1,
      style_scores: { levelsio: 65, builder: 45, hype: 72, tactical: 58, reflective: 38 },
    },
    interactions: [],
    influencers: {
      influencers: {
        levelsio: { user_id: '1', username: 'levelsio', followers: 450000, description: 'Building in public', why: 'Build in public OG', resolved_at: '2026-02-09T10:00:00Z' },
        marc_louvion: { user_id: '2', username: 'marc_louvion', followers: 85000, description: 'SaaS builder', why: 'SaaS founder, build in public', resolved_at: '2026-02-09T10:00:00Z' },
      },
      interactions: [],
      last_check: '2026-02-09T12:00:00Z',
    },
    promoted: { promoted_tweets: [], evaluations: [], budget_spent: 0, total_impressions_from_promoted: 0 },
    journal: [],
    synced_at: '2026-02-09T12:00:00Z',
  };
}
