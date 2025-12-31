# Mr Tesla Bullshit Detector - AI Agent Implementation Plan

## Project Overview
A single-page Next.js app that aggregates and scores outrageous/viral claims about Tesla, Elon Musk, and SpaceX from news and social media (X/Twitter focus), displaying them in a feed sorted by "bullshit score" and virality.

**Core Features:**
- Main feed page with scored claims
- Firebase Authentication (paid tier prep)
- Hourly data collection via cron
- AI-powered "bullshit scoring"
- Clean card-based UI

---

## Tech Stack

### Core
- **Framework**: Next.js 15+ (App Router, TypeScript, Tailwind CSS)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Deployment**: Vercel
- **Scheduling**: Vercel Cron Jobs

### Data Sources
- **News**: NewsAPI.org (100 req/day free) or GNews.io
- **X/Twitter**: TwitterAPI.io or Apify X Scraper (pay-as-you-go)
- **Optional**: Reddit API (r/tesla, r/elonmusk)

### AI Processing
- **Primary**: Grok API (xAI) for Tesla-specific context
- **Fallback**: OpenAI GPT-4o-mini or Gemini Flash

---

## Step-by-Step Implementation

### STEP 1: Project Initialization

**Task**: Create Next.js project with proper configuration

```bash
# Execute these commands
npx create-next-app@latest mr-tesla-bullshit-detector \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd mr-tesla-bullshit-detector

# Install core dependencies
npm install firebase firebase-admin
npm install axios cheerio
npm install date-fns
npm install @heroicons/react
npm install zustand  # State management
```

**Expected Output**: 
- Next.js project structure with App Router
- All dependencies installed
- TypeScript configured

---

### STEP 2: Firebase Setup

**Task**: Configure Firebase project and create client/admin connections

#### 2.1 Create Firebase Configuration Files

**File**: `src/lib/firebase/config.ts`
```typescript
// Firebase client configuration
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

**File**: `src/lib/firebase/client.ts`
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Initialize Firebase (client-side)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
```

**File**: `src/lib/firebase/admin.ts`
```typescript
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

export default admin;
```

#### 2.2 Create Environment Variables Template

**File**: `.env.local`
```bash
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Secret)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key"

# API Keys
NEWSAPI_KEY=your_newsapi_key
TWITTERAPI_KEY=your_twitterapi_key
GROK_API_KEY=your_grok_api_key

# Optional
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
REDDIT_CLIENT_ID=your_reddit_id
REDDIT_CLIENT_SECRET=your_reddit_secret

# Cron Secret (for security)
CRON_SECRET=your_random_secret_string
```

**File**: `.env.example` (copy of above without values)

**File**: `.gitignore` (add if not present)
```
.env.local
.env
firebase-adminsdk-*.json
```

---

### STEP 3: Firestore Data Schema

**Task**: Define data models and create Firestore rules

#### 3.1 Data Models

**File**: `src/types/index.ts`
```typescript
export interface Claim {
  id: string;
  title: string;
  description: string;
  url: string;
  source: 'news' | 'x' | 'reddit';
  
  // Metrics
  engagement: number;  // likes + retweets + comments
  bullshitScore: number;  // 1-10 from AI
  viralityScore: number;  // computed metric
  
  // AI Analysis
  aiReasoning: string;  // Why this score?
  tags: string[];  // ['cybertruck', 'fsd', 'stock', etc]
  sentiment: 'positive' | 'negative' | 'neutral';
  
  // Metadata
  publishedAt: Date;
  fetchedAt: Date;
  processed: boolean;
  
  // Optional
  imageUrl?: string;
  authorHandle?: string;
  sourceName?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  isPremium: boolean;
  createdAt: Date;
  lastLogin: Date;
}

export interface FetchLog {
  id: string;
  timestamp: Date;
  source: string;
  itemsFetched: number;
  itemsProcessed: number;
  errors: string[];
  duration: number;  // milliseconds
}
```

#### 3.2 Firestore Rules

**File**: `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public read for claims (feed is public)
    match /claims/{claimId} {
      allow read: if true;
      allow write: if false;  // Only server can write
    }
    
    // User data (private)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Fetch logs (admin only)
    match /fetchLogs/{logId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

#### 3.3 Firestore Indexes

**File**: `firestore.indexes.json`
```json
{
  "indexes": [
    {
      "collectionGroup": "claims",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "processed", "order": "ASCENDING" },
        { "fieldPath": "viralityScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "claims",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "source", "order": "ASCENDING" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "claims",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "bullshitScore", "order": "DESCENDING" },
        { "fieldPath": "engagement", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Action**: Deploy rules and indexes
```bash
# Install Firebase CLI if not present
npm install -g firebase-tools

# Login and init
firebase login
firebase init firestore

# Deploy
firebase deploy --only firestore:rules,firestore:indexes
```

---

### STEP 4: Data Fetching Functions

**Task**: Create modular functions to fetch from each source

#### 4.1 News API Fetcher

**File**: `src/lib/fetchers/news.ts`
```typescript
import axios from 'axios';
import { Claim } from '@/types';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  urlToImage?: string;
}

export async function fetchTeslaNews(): Promise<Partial<Claim>[]> {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'Tesla OR "Elon Musk" OR SpaceX OR Cybertruck OR "Full Self Driving"',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 50,
        apiKey: process.env.NEWSAPI_KEY,
      },
      timeout: 10000,
    });

    return response.data.articles.map((article: NewsArticle) => ({
      title: article.title,
      description: article.description || article.title,
      url: article.url,
      source: 'news' as const,
      engagement: 0,  // NewsAPI doesn't provide engagement
      publishedAt: new Date(article.publishedAt),
      fetchedAt: new Date(),
      processed: false,
      sourceName: article.source.name,
      imageUrl: article.urlToImage,
    }));
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}
```

#### 4.2 X/Twitter API Fetcher

**File**: `src/lib/fetchers/twitter.ts`
```typescript
import axios from 'axios';
import { Claim } from '@/types';

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
}

export async function fetchXTeslaPosts(): Promise<Partial<Claim>[]> {
  try {
    // Using TwitterAPI.io as example
    const response = await axios.get('https://api.twitterapi.io/v2/search', {
      headers: {
        'x-api-key': process.env.TWITTERAPI_KEY,
      },
      params: {
        query: '(Tesla OR Elon OR Musk OR SpaceX OR Cybertruck OR FSD) min_faves:500 lang:en',
        max_results: 100,
        'tweet.fields': 'created_at,public_metrics,author_id',
      },
      timeout: 10000,
    });

    return response.data.data.map((tweet: Tweet) => {
      const engagement = 
        tweet.public_metrics.like_count +
        tweet.public_metrics.retweet_count * 2 +  // Retweets worth more
        tweet.public_metrics.reply_count +
        tweet.public_metrics.quote_count * 1.5;

      return {
        title: tweet.text.slice(0, 100) + (tweet.text.length > 100 ? '...' : ''),
        description: tweet.text,
        url: `https://x.com/i/web/status/${tweet.id}`,
        source: 'x' as const,
        engagement: Math.round(engagement),
        publishedAt: new Date(tweet.created_at),
        fetchedAt: new Date(),
        processed: false,
        authorHandle: tweet.author_id,
      };
    });
  } catch (error) {
    console.error('Error fetching X posts:', error);
    throw error;
  }
}
```

#### 4.3 Reddit API Fetcher (Optional)

**File**: `src/lib/fetchers/reddit.ts`
```typescript
import axios from 'axios';
import { Claim } from '@/types';

export async function fetchRedditTesla(): Promise<Partial<Claim>[]> {
  try {
    // Get OAuth token
    const authResponse = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      'grant_type=client_credentials',
      {
        auth: {
          username: process.env.REDDIT_CLIENT_ID!,
          password: process.env.REDDIT_CLIENT_SECRET!,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const token = authResponse.data.access_token;

    // Fetch hot posts from multiple subreddits
    const subreddits = ['tesla', 'elonmusk', 'teslamotors'];
    const allPosts: Partial<Claim>[] = [];

    for (const subreddit of subreddits) {
      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/hot`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'MrTeslaBullshitDetector/1.0',
          },
          params: {
            limit: 25,
          },
        }
      );

      const posts = response.data.data.children.map((post: any) => ({
        title: post.data.title,
        description: post.data.selftext || post.data.title,
        url: `https://reddit.com${post.data.permalink}`,
        source: 'reddit' as const,
        engagement: post.data.score + post.data.num_comments * 2,
        publishedAt: new Date(post.data.created_utc * 1000),
        fetchedAt: new Date(),
        processed: false,
        sourceName: `r/${subreddit}`,
      }));

      allPosts.push(...posts);
    }

    return allPosts;
  } catch (error) {
    console.error('Error fetching Reddit:', error);
    return [];  // Don't fail entire cron if Reddit fails
  }
}
```

---

### STEP 5: AI Scoring System

**Task**: Create AI-powered bullshit scoring using Grok/OpenAI

#### 5.1 AI Scoring Function

**File**: `src/lib/ai/scorer.ts`
```typescript
import axios from 'axios';

export interface ScoringResult {
  bullshitScore: number;  // 1-10
  reasoning: string;
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export async function scoreClaimWithGrok(
  title: string,
  description: string,
  source: string
): Promise<ScoringResult> {
  const prompt = `
You are a Tesla/Elon Musk claim analyzer. Score this claim on a 1-10 "bullshit scale" where:
- 1 = Completely factual, verified, boring
- 5 = Exaggerated but has some truth
- 10 = Completely false, absurd, or wildly sensationalized

Claim Title: "${title}"
Full Text: "${description}"
Source: ${source}

Analyze for:
1. Factual accuracy vs. exaggeration
2. Sensationalism level
3. Likelihood of being clickbait
4. Verifiability

Respond ONLY with valid JSON (no markdown):
{
  "bullshitScore": <number 1-10>,
  "reasoning": "<2-3 sentence explanation>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"],
  "sentiment": "positive|negative|neutral"
}

Tags should be from: cybertruck, model3, modely, modelx, fsd, autopilot, stock, spacex, starship, twitter, neuralink, boring, solar, battery, production, recall, lawsuit, sec, fraud, innovation, hype
`;

  try {
    // Try Grok first
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-beta',
        messages: [
          { role: 'system', content: 'You are a factual analyst specializing in Tesla and Elon Musk claims.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const content = response.data.choices[0].message.content;
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    return {
      bullshitScore: Math.max(1, Math.min(10, result.bullshitScore)),
      reasoning: result.reasoning,
      tags: result.tags.slice(0, 5),
      sentiment: result.sentiment,
    };
  } catch (error) {
    console.error('Grok API error, falling back to OpenAI:', error);
    return await scoreClaimWithOpenAI(title, description, source);
  }
}

async function scoreClaimWithOpenAI(
  title: string,
  description: string,
  source: string
): Promise<ScoringResult> {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a factual analyst specializing in Tesla and Elon Musk claims.' },
          { 
            role: 'user', 
            content: `Score this claim on a 1-10 bullshit scale. Title: "${title}" Text: "${description}" Source: ${source}. Respond with JSON: {bullshitScore, reasoning, tags, sentiment}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content);

    return {
      bullshitScore: Math.max(1, Math.min(10, result.bullshitScore)),
      reasoning: result.reasoning,
      tags: result.tags.slice(0, 5),
      sentiment: result.sentiment,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Return default score if both fail
    return {
      bullshitScore: 5,
      reasoning: 'Unable to score automatically',
      tags: ['unscored'],
      sentiment: 'neutral',
    };
  }
}
```

---

### STEP 6: Virality Score Calculator

**Task**: Create algorithm to combine engagement + bullshit score

**File**: `src/lib/utils/virality.ts`
```typescript
import { Claim } from '@/types';

export function calculateViralityScore(claim: Partial<Claim>): number {
  const engagement = claim.engagement || 0;
  const bullshitScore = claim.bullshitScore || 0;
  
  // Normalize engagement (log scale to prevent massive outliers)
  const normalizedEngagement = Math.log10(engagement + 1) * 10;
  
  // Weight: 60% bullshit score, 40% engagement
  const viralityScore = (bullshitScore * 6) + (normalizedEngagement * 4);
  
  // Bonus for X posts (they're typically more viral)
  const sourceBonus = claim.source === 'x' ? 5 : 0;
  
  // Recency bonus (newer posts get slight boost)
  const hoursOld = claim.publishedAt 
    ? (Date.now() - new Date(claim.publishedAt).getTime()) / (1000 * 60 * 60)
    : 24;
  const recencyBonus = Math.max(0, 5 - (hoursOld / 4));  // Up to 5 points for very recent
  
  return Math.round(viralityScore + sourceBonus + recencyBonus);
}

export function deduplicateClaims(claims: Partial<Claim>[]): Partial<Claim>[] {
  const seen = new Set<string>();
  const unique: Partial<Claim>[] = [];
  
  for (const claim of claims) {
    // Create fingerprint from title + URL
    const fingerprint = `${claim.title?.toLowerCase().slice(0, 50)}-${claim.url}`;
    
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      unique.push(claim);
    }
  }
  
  return unique;
}
```

---

### STEP 7: Cron Job API Route

**Task**: Create endpoint that fetches, processes, and stores claims

**File**: `src/app/api/cron/fetch-claims/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { fetchTeslaNews } from '@/lib/fetchers/news';
import { fetchXTeslaPosts } from '@/lib/fetchers/twitter';
import { fetchRedditTesla } from '@/lib/fetchers/reddit';
import { scoreClaimWithGrok } from '@/lib/ai/scorer';
import { calculateViralityScore, deduplicateClaims } from '@/lib/utils/virality';
import { Claim } from '@/types';

export async function GET(req: NextRequest) {
  // Security: Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const errors: string[] = [];
  let totalFetched = 0;
  let totalProcessed = 0;

  try {
    console.log('🤖 Starting claim fetch cycle...');

    // Step 1: Fetch from all sources in parallel
    const [newsResults, xResults, redditResults] = await Promise.allSettled([
      fetchTeslaNews(),
      fetchXTeslaPosts(),
      fetchRedditTesla(),
    ]);

    const allClaims: Partial<Claim>[] = [];

    if (newsResults.status === 'fulfilled') {
      allClaims.push(...newsResults.value);
      console.log(`✅ Fetched ${newsResults.value.length} news articles`);
    } else {
      errors.push(`News fetch failed: ${newsResults.reason}`);
      console.error('❌ News fetch failed:', newsResults.reason);
    }

    if (xResults.status === 'fulfilled') {
      allClaims.push(...xResults.value);
      console.log(`✅ Fetched ${xResults.value.length} X posts`);
    } else {
      errors.push(`X fetch failed: ${xResults.reason}`);
      console.error('❌ X fetch failed:', xResults.reason);
    }

    if (redditResults.status === 'fulfilled') {
      allClaims.push(...redditResults.value);
      console.log(`✅ Fetched ${redditResults.value.length} Reddit posts`);
    } else {
      errors.push(`Reddit fetch failed: ${redditResults.reason}`);
      console.error('❌ Reddit fetch failed:', redditResults.reason);
    }

    totalFetched = allClaims.length;

    // Step 2: Deduplicate
    const uniqueClaims = deduplicateClaims(allClaims);
    console.log(`🔍 Deduplicated to ${uniqueClaims.length} unique claims`);

    // Step 3: Check which claims are new (not already in DB)
    const existingUrls = new Set<string>();
    const urlsToCheck = uniqueClaims.map(c => c.url!);
    
    const existingSnapshot = await adminDb
      .collection('claims')
      .where('url', 'in', urlsToCheck.slice(0, 10))  // Firestore 'in' limit is 10
      .get();

    existingSnapshot.forEach(doc => {
      existingUrls.add(doc.data().url);
    });

    const newClaims = uniqueClaims.filter(c => !existingUrls.has(c.url!));
    console.log(`🆕 Found ${newClaims.length} new claims to process`);

    // Step 4: Process new claims with AI (batch of 10 at a time to avoid rate limits)
    const batchSize = 10;
    const processedClaims: Claim[] = [];

    for (let i = 0; i < newClaims.length; i += batchSize) {
      const batch = newClaims.slice(i, i + batchSize);
      
      const scoredBatch = await Promise.allSettled(
        batch.map(async (claim) => {
          try {
            const scoring = await scoreClaimWithGrok(
              claim.title!,
              claim.description!,
              claim.source!
            );

            const fullClaim: Claim = {
              id: adminDb.collection('claims').doc().id,
              title: claim.title!,
              description: claim.description!,
              url: claim.url!,
              source: claim.source!,
              engagement: claim.engagement!,
              bullshitScore: scoring.bullshitScore,
              viralityScore: 0,  // Will calculate below
              aiReasoning: scoring.reasoning,
              tags: scoring.tags,
              sentiment: scoring.sentiment,
              publishedAt: claim.publishedAt!,
              fetchedAt: new Date(),
              processed: true,
              imageUrl: claim.imageUrl,
              authorHandle: claim.authorHandle,
              sourceName: claim.sourceName,
            };

            // Calculate virality score
            fullClaim.viralityScore = calculateViralityScore(fullClaim);

            return fullClaim;
          } catch (error) {
            console.error(`Error processing claim: ${claim.title}`, error);
            errors.push(`Processing error: ${claim.title}`);
            return null;
          }
        })
      );

      scoredBatch.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          processedClaims.push(result.value);
        }
      });

      // Rate limiting delay between batches
      if (i + batchSize < newClaims.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));  // 2 second delay
      }
    }

    console.log(`✅ Processed ${processedClaims.length} claims with AI`);

    // Step 5: Save to Firestore (batch write)
    const batch = adminDb.batch();
    
    processedClaims.forEach((claim) => {
      const docRef = adminDb.collection('claims').doc(claim.id);
      batch.set(docRef, {
        ...claim,
        publishedAt: claim.publishedAt,
        fetchedAt: claim.fetchedAt,
      });
    });

    await batch.commit();
    totalProcessed = processedClaims.length;
    console.log(`💾 Saved ${totalProcessed} claims to Firestore`);

    // Step 6: Log this fetch cycle
    const duration = Date.now() - startTime;
    await adminDb.collection('fetchLogs').add({
      timestamp: new Date(),
      source: 'cron',
      itemsFetched: totalFetched,
      itemsProcessed: totalProcessed,
      errors,
      duration,
    });

    console.log(`✅ Fetch cycle completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      fetched: totalFetched,
      processed: totalProcessed,
      duration,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('❌ Fatal error in cron job:', error);
    
    // Log error
    const duration = Date.now() - startTime;
    await adminDb.collection('fetchLogs').add({
      timestamp: new Date(),
      source: 'cron',
      itemsFetched: totalFetched,
      itemsProcessed: totalProcessed,
      errors: [...errors, `Fatal: ${error.message}`],
      duration,
    });

    return NextResponse.json(
      { 
        error: 'Cron job failed', 
        details: error.message,
        fetched: totalFetched,
        processed: totalProcessed,
      },
      { status: 500 }
    );
  }
}

// Vercel cron requires maxDuration
export const maxDuration = 300;  // 5 minutes
```

---

### STEP 8: Frontend - Main Feed Page

**Task**: Create the main feed UI with claim cards

#### 8.1 Feed Page

**File**: `src/app/page.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Claim } from '@/types';
import ClaimCard from '@/components/ClaimCard';
import FilterBar from '@/components/FilterBar';

export default function HomePage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'news' | 'x' | 'reddit'>('all');
  const [sortBy, setSortBy] = useState<'virality' | 'bullshit' | 'recent'>('virality');

  useEffect(() => {
    loadClaims();
  }, [filter, sortBy]);

  const loadClaims = async () => {
    try {
      setLoading(true);

      let q = query(
        collection(db, 'claims'),
        where('processed', '==', true)
      );

      // Apply filter
      if (filter !== 'all') {
        q = query(q, where('source', '==', filter));
      }

      // Apply sorting
      if (sortBy === 'virality') {
        q = query(q, orderBy('viralityScore', 'desc'));
      } else if (sortBy === 'bullshit') {
        q = query(q, orderBy('bullshitScore', 'desc'));
      } else {
        q = query(q, orderBy('publishedAt', 'desc'));
      }

      q = query(q, limit(50));

      const snapshot = await getDocs(q);
      const claimList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt.toDate(),
        fetchedAt: doc.data().fetchedAt.toDate(),
      })) as Claim[];

      setClaims(claimList);
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            ⚡ Mr Tesla Bullshit Detector
          </h1>
          <p className="text-lg opacity-90">
            Separating Tesla facts from fiction, one viral claim at a time
          </p>
        </div>
      </header>

      {/* Filter Bar */}
      <FilterBar
        filter={filter}
        sortBy={sortBy}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
      />

      {/* Feed */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-xl text-gray-500">Loading claims...</div>
          </div>
        ) : claims.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">No claims found</p>
            <p className="text-sm text-gray-400 mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {claims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4 mt-12">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm opacity-75">
            For entertainment purposes only. Not financial or investment advice.
          </p>
          <p className="text-xs opacity-50 mt-2">
            Data sourced from news APIs and social media. Claims scored by AI.
          </p>
        </div>
      </footer>
    </main>
  );
}
```

#### 8.2 Claim Card Component

**File**: `src/components/ClaimCard.tsx`
```typescript
'use client';

import { Claim } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { FireIcon, NewspaperIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';

interface ClaimCardProps {
  claim: Claim;
}

export default function ClaimCard({ claim }: ClaimCardProps) {
  const getBullshitColor = (score: number) => {
    if (score >= 8) return 'bg-red-500';
    if (score >= 6) return 'bg-orange-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'news':
        return <NewspaperIcon className="w-5 h-5" />;
      case 'x':
        return <ChatBubbleLeftIcon className="w-5 h-5" />;
      case 'reddit':
        return <ChatBubbleLeftIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <a
      href={claim.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {getSourceIcon(claim.source)}
          <span className="capitalize">{claim.source}</span>
          {claim.sourceName && (
            <>
              <span>•</span>
              <span>{claim.sourceName}</span>
            </>
          )}
        </div>

        {/* Bullshit Score Badge */}
        <div className={`${getBullshitColor(claim.bullshitScore)} text-white px-3 py-1 rounded-full font-bold text-sm`}>
          💩 {claim.bullshitScore}/10
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-3">
        {claim.title}
      </h2>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {claim.description}
      </p>

      {/* AI Reasoning */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
        <p className="text-xs font-semibold text-blue-900 mb-1">🤖 AI Analysis:</p>
        <p className="text-xs text-blue-800">{claim.aiReasoning}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {claim.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <FireIcon className="w-4 h-4 text-orange-500" />
            <span>{claim.engagement.toLocaleString()}</span>
          </div>
          <div>
            Virality: <span className="font-semibold">{claim.viralityScore}</span>
          </div>
        </div>
        <div>
          {formatDistanceToNow(claim.publishedAt, { addSuffix: true })}
        </div>
      </div>
    </a>
  );
}
```

#### 8.3 Filter Bar Component

**File**: `src/components/FilterBar.tsx`
```typescript
'use client';

interface FilterBarProps {
  filter: 'all' | 'news' | 'x' | 'reddit';
  sortBy: 'virality' | 'bullshit' | 'recent';
  onFilterChange: (filter: 'all' | 'news' | 'x' | 'reddit') => void;
  onSortChange: (sort: 'virality' | 'bullshit' | 'recent') => void;
}

export default function FilterBar({
  filter,
  sortBy,
  onFilterChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 py-4 px-4 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Source Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Sources
          </button>
          <button
            onClick={() => onFilterChange('news')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'news'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            News
          </button>
          <button
            onClick={() => onFilterChange('x')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'x'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            𝕏 Twitter
          </button>
          <button
            onClick={() => onFilterChange('reddit')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'reddit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Reddit
          </button>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="virality">🔥 Virality</option>
            <option value="bullshit">💩 Bullshit Score</option>
            <option value="recent">🕐 Most Recent</option>
          </select>
        </div>
      </div>
    </div>
  );
}
```

---

### STEP 9: Vercel Configuration

**Task**: Configure Vercel deployment and cron jobs

#### 9.1 Vercel Configuration File

**File**: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-claims",
      "schedule": "0 * * * *"
    }
  ],
  "functions": {
    "src/app/api/cron/fetch-claims/route.ts": {
      "maxDuration": 300
    }
  }
}
```

#### 9.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (first time)
vercel

# Set environment variables in Vercel dashboard:
# Project Settings → Environment Variables → Add all from .env.local

# Deploy production
vercel --prod
```

---

### STEP 10: Authentication Setup (Future Paid Tier)

**Task**: Add Firebase Auth for future premium features

**File**: `src/components/AuthButton.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/client';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return <div className="w-24 h-10 bg-gray-200 animate-pulse rounded" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">{user.displayName || user.email}</span>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Sign In
    </button>
  );
}
```

Add to header in `src/app/page.tsx`:
```typescript
import AuthButton from '@/components/AuthButton';

// In header section:
<div className="flex justify-between items-center">
  <h1>...</h1>
  <AuthButton />
</div>
```

---

### STEP 11: Testing Checklist

**Task**: Verify all components work

```markdown
## Local Testing
- [ ] `npm run dev` starts successfully
- [ ] Home page loads with header and filter bar
- [ ] Firebase connection works (no console errors)
- [ ] Can manually trigger cron job: `curl http://localhost:3000/api/cron/fetch-claims -H "Authorization: Bearer YOUR_CRON_SECRET"`
- [ ] Claims appear in feed after cron run
- [ ] Filter buttons work
- [ ] Sort dropdown works
- [ ] Claim cards display correctly
- [ ] External links open in new tab
- [ ] Auth button shows sign in option

## API Testing
- [ ] News API returns data
- [ ] X/Twitter API returns data
- [ ] AI scoring returns valid JSON
- [ ] Firestore writes succeed
- [ ] Duplicate detection works

## Production Testing
- [ ] Vercel deployment successful
- [ ] Environment variables set correctly
- [ ] Cron job runs on schedule (check Vercel logs)
- [ ] Claims accumulate over time
- [ ] No rate limit errors
- [ ] Firebase costs stay within free tier

## Performance
- [ ] Page load time < 3s
- [ ] Cron completes within 5 min timeout
- [ ] No memory leaks in long-running cron
- [ ] Images load lazily (if added)
```

---

### STEP 12: Future Enhancements Roadmap

**Features to Add Later:**

#### Phase 2 (Week 2-3)
- [ ] Detailed claim page (click card → full view with sources)
- [ ] Share buttons (Twitter, Reddit, Copy link)
- [ ] Search functionality
- [ ] Trending tags page
- [ ] Email notifications for high-score claims

#### Phase 3 (Month 2)
- [ ] Premium features:
  - [ ] Claim history graphs
  - [ ] Export claims to PDF
  - [ ] Custom alerts for keywords
  - [ ] API access for developers
- [ ] User profiles
- [ ] Comment system (moderated)
- [ ] Voting system (users vote on accuracy)

#### Phase 4 (Month 3+)
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Webhook integrations
- [ ] Partnership with fact-checkers

---

## Quick Start Commands for AI Agent

```bash
# Initial setup
npx create-next-app@latest mr-tesla-bullshit-detector --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd mr-tesla-bullshit-detector
npm install firebase firebase-admin axios cheerio date-fns @heroicons/react zustand

# Create all directories
mkdir -p src/lib/firebase
mkdir -p src/lib/fetchers
mkdir -p src/lib/ai
mkdir -p src/lib/utils
mkdir -p src/types
mkdir -p src/components
mkdir -p src/app/api/cron/fetch-claims

# Initialize Firebase
firebase login
firebase init firestore

# Deploy Firestore rules
firebase deploy --only firestore:rules,firestore:indexes

# Local development
npm run dev

# Deploy to Vercel
vercel login
vercel
# Set environment variables in dashboard
vercel --prod
```

---

## Environment Variables Summary

Copy this exact structure to `.env.local`:

```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# API Keys
NEWSAPI_KEY=
TWITTERAPI_KEY=
GROK_API_KEY=

# Optional
OPENAI_API_KEY=
GEMINI_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

# Security
CRON_SECRET=random_secret_string_here
```

---

## Success Criteria

- ✅ Cron job runs hourly without errors
- ✅ New claims appear in feed within 1 hour
- ✅ Bullshit scores are accurate and entertaining
- ✅ Page loads in < 3 seconds
- ✅ No Firebase overage costs
- ✅ Clean, responsive UI on mobile and desktop
- ✅ Zero security vulnerabilities
- ✅ Ready to add paid features

---

**Document Version**: 1.0  
**Optimized For**: AI Agent IDEs (Cursor, Windsurf, etc.)  
**Estimated Build Time**: 2-3 days with AI assistance  
**Total Complexity**: Medium (well-documented, modular)
