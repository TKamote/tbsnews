import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { fetchTeslaNews, fetchXPosts, fetchRedditPosts } from '@/lib/fetchers';
import { scoreClaim } from '@/lib/ai';
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let itemsFetched = 0;
  let itemsProcessed = 0;
  const errors: string[] = [];

  try {
    if (!adminDb) {
      return NextResponse.json({ 
        error: 'Firebase Admin not configured',
        message: 'Set FIREBASE_ADMIN_* environment variables to enable data fetching.'
      }, { status: 503 });
    }

    // Fetch from all sources
    const [newsItems, xItems, redditItems] = await Promise.all([
      fetchTeslaNews(),
      fetchXPosts(),
      fetchRedditPosts(),
    ]);

    const combinedItems = [...newsItems, ...xItems, ...redditItems];
    itemsFetched = combinedItems.length;

    if (itemsFetched === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No items found',
        fetched: 0,
        processed: 0,
        duration: Date.now() - startTime
      });
    }

    // Process each item
    for (const item of combinedItems) {
      try {
        // Check if URL already exists in DB
        const existing = await adminDb.collection('claims')
          .where('url', '==', item.url)
          .limit(1)
          .get();

        if (!existing.empty) continue;

        // Score with AI
        const scoring = await scoreClaim(item.title, item.description);

        // Save if ridiculous (Score >= 3)
        if (scoring.bullshitScore >= 3) {
          await adminDb.collection('claims').add({
            title: item.title,
            description: item.description,
            url: item.url,
            source: item.type, // 'news' | 'x' | 'reddit'
            sourceName: item.source,
            bullshitScore: scoring.bullshitScore,
            aiReasoning: scoring.reasoning,
            tags: scoring.tags,
            publishedAt: admin.firestore.Timestamp.fromDate(new Date(item.publishedAt)),
            fetchedAt: admin.firestore.Timestamp.now(),
          });
          itemsProcessed++;
        }
      } catch (err: any) {
        console.error(`Error processing item: ${item.title}`, err);
        errors.push(`${item.title}: ${err.message}`);
      }
    }

    // Log the fetch cycle
    const duration = Date.now() - startTime;
    await adminDb.collection('fetchLogs').add({
      timestamp: admin.firestore.Timestamp.now(),
      itemsFetched,
      itemsProcessed,
      errors,
      duration,
    });

    return NextResponse.json({
      success: true,
      fetched: itemsFetched,
      processed: itemsProcessed,
      duration,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err: any) {
    console.error('Fatal Fetch Error:', err);
    return NextResponse.json({ 
      error: 'Fatal error', 
      details: err.message,
      fetched: itemsFetched,
      processed: itemsProcessed,
    }, { status: 500 });
  }
}

// Allow longer duration for manual fetches
export const maxDuration = 300; // 5 minutes

