import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { fetchTeslaNews, fetchXPosts, fetchRedditPosts } from '@/lib/fetchers';
import { scoreClaim, isRelevantToTesla } from '@/lib/ai';
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let itemsFetched = 0;
  let itemsProcessed = 0;
  const errors: string[] = [];

  try {
    if (!adminDb) {
      const missingVars = [];
      if (!process.env.FIREBASE_ADMIN_PROJECT_ID) missingVars.push('FIREBASE_ADMIN_PROJECT_ID');
      if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) missingVars.push('FIREBASE_ADMIN_CLIENT_EMAIL');
      if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) missingVars.push('FIREBASE_ADMIN_PRIVATE_KEY');
      
      return NextResponse.json({ 
        error: 'Firebase Admin not configured',
        message: `Missing environment variables: ${missingVars.join(', ')}`,
        details: 'Set FIREBASE_ADMIN_* environment variables in Vercel to enable data fetching.'
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

    console.log(`Fetched items: News=${newsItems.length}, X=${xItems.length}, Reddit=${redditItems.length}, Total=${itemsFetched}`);

    if (itemsFetched === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No items found from any source. Check API keys and source availability.',
        fetched: 0,
        processed: 0,
        duration: Date.now() - startTime
      });
    }

    // Process each item
    for (const item of combinedItems) {
      try {
        // Check if URL already exists in DB
        let existing;
        try {
          existing = await adminDb.collection('claims')
            .where('url', '==', item.url)
            .limit(1)
            .get();
        } catch (queryErr: any) {
          console.error('Error querying claims:', queryErr);
          errors.push(`Query error for ${item.title}: ${queryErr.message}`);
          continue;
        }

        if (!existing.empty) continue;

        // Check relevance first - skip if not about Tesla/Elon
        const isRelevant = await isRelevantToTesla(item.title, item.description);
        if (!isRelevant) {
          console.log(`Skipping irrelevant item: ${item.title.substring(0, 50)}...`);
          continue;
        }
        
        console.log(`Processing relevant item: ${item.title.substring(0, 50)}...`);

        // Score with AI
        console.log(`Scoring: ${item.title}`);
        const scoring = await scoreClaim(item.title, item.description);
        console.log(`Scored: ${item.title} - Score: ${scoring.bullshitScore}`);

        // Save if ridiculous (Score >= 3)
        if (scoring.bullshitScore >= 3) {
          try {
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
          } catch (writeErr: any) {
            console.error(`Error writing claim: ${item.title}`, writeErr);
            errors.push(`Write error for ${item.title}: ${writeErr.message} (Code: ${writeErr.code})`);
          }
        }
      } catch (err: any) {
        console.error(`Error processing item: ${item.title}`, err);
        errors.push(`${item.title}: ${err.message} (Code: ${err.code || 'unknown'})`);
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

    console.log(`Fetch complete: Fetched=${itemsFetched}, Processed=${itemsProcessed}, Errors=${errors.length}`);

    return NextResponse.json({
      success: true,
      fetched: itemsFetched,
      processed: itemsProcessed,
      skipped: itemsFetched - itemsProcessed - errors.length,
      duration,
      errors: errors.length > 0 ? errors : undefined,
      message: itemsProcessed > 0 
        ? `Successfully processed ${itemsProcessed} new claims`
        : itemsFetched > 0 
          ? `Fetched ${itemsFetched} items but none met criteria (already exist, not relevant, or score < 3)`
          : 'No items found'
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

