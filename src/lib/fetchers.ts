import axios from 'axios';

export interface RawNewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  type: 'news' | 'x' | 'reddit';
}

export async function fetchTeslaNews(): Promise<RawNewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.error('NEWS_API_KEY is missing');
    return [];
  }

  try {
    // Fetch news from NewsAPI.org (free tier allows 100 requests per day)
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'Tesla OR "Elon Musk" OR Cybertruck',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10, // Keep it small for the 8h cycle
        apiKey: apiKey,
      }
    });

    return response.data.articles.map((a: any) => ({
      title: a.title,
      description: a.description || a.title,
      url: a.url,
      source: a.source.name,
      publishedAt: a.publishedAt,
      type: 'news' as const,
    }));
  } catch (error) {
    console.error("News Fetch Error:", error);
    return [];
  }
}

export async function fetchXPosts(): Promise<RawNewsItem[]> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    console.warn('X_BEARER_TOKEN is missing, skipping X fetch');
    return [];
  }

  try {
    // Search for recent tweets about Tesla/Elon with high engagement to filter noise
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
      params: {
        query: '(Tesla OR Elon OR Musk OR Cybertruck) -is:retweet lang:en',
        max_results: 10,
        'tweet.fields': 'created_at,public_metrics,author_id',
      }
    });

    if (!response.data.data) return [];

    return response.data.data.map((tweet: any) => ({
      title: tweet.text.slice(0, 100) + (tweet.text.length > 100 ? '...' : ''),
      description: tweet.text,
      url: `https://x.com/user/status/${tweet.id}`,
      source: 'X (Twitter)',
      publishedAt: tweet.created_at,
      type: 'x' as const,
    }));
  } catch (error) {
    console.error("X Fetch Error:", error);
    return [];
  }
}

export async function fetchRedditPosts(): Promise<RawNewsItem[]> {
  try {
    // Fetch from r/TeslaMotors and r/ElonMusk
    const subreddits = ['teslamotors', 'elonmusk'];
    const allPosts: RawNewsItem[] = [];

    for (const sub of subreddits) {
      const response = await axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=5`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (BullshitDetector/1.0)',
        }
      });

      const posts = response.data.data.children.map((child: any) => ({
        title: child.data.title,
        description: child.data.selftext || child.data.title,
        url: `https://reddit.com${child.data.permalink}`,
        source: `r/${sub}`,
        publishedAt: new Date(child.data.created_utc * 1000).toISOString(),
        type: 'reddit' as const,
      }));

      allPosts.push(...posts);
    }

    return allPosts;
  } catch (error) {
    console.error("Reddit Fetch Error:", error);
    return [];
  }
}

