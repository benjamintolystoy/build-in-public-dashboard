export type TweetStyle = 'levelsio' | 'builder' | 'hype' | 'tactical' | 'reflective';

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  quotes: number;
}

export interface Tweet {
  tweet_id: string;
  text: string;
  style: TweetStyle;
  day: number;
  posted_at: string;
  metrics: TweetMetrics | null;
  metrics_fetched_at: string | null;
}

export interface EngagementData {
  tweets: Tweet[];
  day_counter: number;
  style_scores: Record<string, number>;
}

export interface Interaction {
  tweet_id: string;
  action: 'like' | 'reply';
  details: string;
  timestamp: string;
}

export interface InfluencerProfile {
  user_id: string;
  username: string;
  followers: number;
  description: string;
  why: string;
  resolved_at: string;
}

export interface InfluencerData {
  influencers: Record<string, InfluencerProfile>;
  interactions: any[];
  last_check: string | null;
}

export interface PromotedTweet {
  tweet_id: string;
  budget: number;
  style: string;
  notes: string;
  tagged_at: string;
  metrics_snapshots: Array<{ metrics: TweetMetrics; recorded_at: string }>;
  final_metrics: TweetMetrics | null;
  status: 'active' | 'completed';
  completed_at?: string;
}

export interface PromotedData {
  promoted_tweets: PromotedTweet[];
  evaluations: any[];
  budget_spent: number;
  total_impressions_from_promoted: number;
}

export interface DashboardData {
  engagement: EngagementData;
  interactions: Interaction[];
  influencers: InfluencerData;
  promoted: PromotedData;
  synced_at: string;
}

export const STYLE_COLORS: Record<TweetStyle, string> = {
  levelsio: '#3b82f6',
  builder: '#10b981',
  hype: '#f59e0b',
  tactical: '#8b5cf6',
  reflective: '#ec4899',
};

export const STYLE_LABELS: Record<TweetStyle, string> = {
  levelsio: 'Levelsio',
  builder: 'Builder',
  hype: 'Hype',
  tactical: 'Tactical',
  reflective: 'Reflective',
};
