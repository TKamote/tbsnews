export interface Claim {
  id: string;
  title: string;
  description: string;
  url: string;
  source: 'news' | 'x' | 'reddit';
  
  // Metrics
  bullshitScore: number;  // 1-10 from AI
  
  // AI Analysis
  aiReasoning: string;  // Why this score?
  tags: string[];  // ['cybertruck', 'fsd', etc]
  
  // Metadata
  publishedAt: any; // Firestore Timestamp
  fetchedAt: any; // Firestore Timestamp
  sourceName?: string;
  imageUrl?: string;
}

export interface FetchLog {
  id: string;
  timestamp: any;
  itemsFetched: number;
  itemsProcessed: number;
  errors: string[];
  duration: number;
}

