# Troubleshooting: News Not Refreshing

## Issues Fixed

1. ✅ **Better logging** - Now shows what's happening during fetch
2. ✅ **Improved refresh** - Refreshes immediately and again after 3 seconds
3. ✅ **Better relevance check** - Uses keywords first (faster), then AI if needed
4. ✅ **Better error messages** - Shows why items weren't processed

## Check What's Happening

### 1. Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Logs**
2. Look for:
   - "Fetched items: News=X, X=Y, Reddit=Z"
   - "Processing relevant item: ..."
   - "Scored: ... - Score: X"
   - Any error messages

### 2. Check Firebase Console

1. Go to Firebase Console → Firestore Database
2. Check `fetchLogs` collection:
   - See when last fetch happened
   - Check `itemsFetched` vs `itemsProcessed`
   - Look at `errors` array

3. Check `claims` collection:
   - See if new claims are being added
   - Check timestamps

### 3. Test Manual Fetch

Click "Fetch News Now" and check:
- What message appears?
- Does it say "Fetched X items"?
- Does it say "processed Y new claims"?
- Or does it show an error?

## Common Issues

### Issue: "Fetched X items but none met criteria"
**Meaning**: Items were fetched but:
- Already exist in database (duplicates)
- Not relevant to Tesla/Elon (filtered out)
- Score < 3 (not ridiculous enough)

**Solution**: This is normal! It means the system is working but filtering out items.

### Issue: "No items found"
**Meaning**: NewsAPI/Reddit returned no results

**Possible causes**:
- NewsAPI rate limit (100/day) - wait 24 hours
- No new Tesla/Elon news available
- API keys missing or invalid

### Issue: Cron not running after 24 hours
**Check**:
1. Vercel Dashboard → Settings → Cron Jobs
2. Should see: `/api/cron/fetch` scheduled for "Daily at 00:00 UTC"
3. Check Logs tab for cron execution history

**If cron not showing**:
- Make sure `vercel.json` is committed and deployed
- Cron jobs only work on Production deployments (not preview)

## Debug Steps

1. **Check API keys in Vercel**:
   - `NEWS_API_KEY` - should be set
   - `GEMINI_API_KEY` - should be set
   - `CRON_SECRET` - should be set

2. **Test manually**:
   ```bash
   curl https://your-app.vercel.app/api/fetch-now \
     -X POST
   ```
   Check the response

3. **Check Firestore**:
   - Are claims being added?
   - Are fetchLogs being created?
   - What do the logs say?

## What to Look For

After clicking "Fetch News Now", you should see in the response:
- `fetched`: Number of items found
- `processed`: Number of new claims saved
- `skipped`: Number filtered out
- `errors`: Any errors that occurred

If `fetched > 0` but `processed = 0`, items are being filtered out (normal behavior).

