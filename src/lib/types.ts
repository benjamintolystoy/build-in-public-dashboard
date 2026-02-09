export type TweetStyle = 'levelsio' | 'builder' | 'hype' | 'tactical' | 'reflective';

export type TweetMetrics = {
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  quotes: number;
};

export type Tweet = {
  tweet_id: string;
  text: string;
  style: TweetStyle;
  day: number;
  posted_at: string;
  metrics: TweetMetrics | null;
  metrics_fetched_at: string | null;
};

export type EngagementData = {
  tweets: Tweet[];
  day_counter: number;
  style_scores: Record<string, number>;
};

export type Interaction = {
  tweet_id: string;
  action: 'like' | 'reply';
  details: string;
  timestamp: string;
};

export type InfluencerProfile = {
  user_id: string;
  username: string;
  followers: number;
  description: string;
  why: string;
  resolved_at: string;
};

export type InfluencerData = {
  influencers: Record<string, InfluencerProfile>;
  interactions: unknown[];
  last_check: string | null;
};

export type PromotedTweet = {
  tweet_id: string;
  budget: number;
  style: string;
  notes: string;
  tagged_at: string;
  metrics_snapshots: Array<{ metrics: TweetMetrics; recorded_at: string }>;
  final_metrics: TweetMetrics | null;
  status: 'active' | 'completed';
  completed_at?: string;
};

export type PromotedData = {
  promoted_tweets: PromotedTweet[];
  evaluations: unknown[];
  budget_spent: number;
  total_impressions_from_promoted: number;
};

export type EngageItem = {
  id: string;
  author: string;
  tweet_text: string;
  tweet_url: string;
  suggestions: string[];
  status: 'pending' | 'done' | 'skipped';
  created_at: string;
};

export type JournalEntry = {
  id: string;
  content: string;
  images: string[];
  tags: string[];
  created_at: string;
};

export type DashboardData = {
  engagement: EngagementData;
  interactions: Interaction[];
  influencers: InfluencerData;
  promoted: PromotedData;
  journal: JournalEntry[];
  synced_at: string;
};

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
