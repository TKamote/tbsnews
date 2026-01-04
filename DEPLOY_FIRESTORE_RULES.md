# Deploy Firestore Rules

The permission error is likely because Firestore rules need to be deployed.

## Quick Deploy

```bash
firebase deploy --only firestore:rules
```

## Full Steps

1. **Make sure you're logged in:**
   ```bash
   firebase login
   ```

2. **Deploy the rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Verify in Firebase Console:**
   - Go to Firebase Console → Firestore Database → Rules
   - You should see the updated rules

## Important Note

The Admin SDK (used by your API routes) **bypasses Firestore rules completely**. So if you're still getting permission errors after deploying rules, the issue is likely:

1. **Admin SDK not initialized** - Check that all `FIREBASE_ADMIN_*` env vars are set in Vercel
2. **Wrong credentials** - Verify the service account key is correct
3. **Rules blocking client reads** - The updated rules now allow public read for `fetchLogs`

## After Deploying

Try the "Fetch News Now" button again. It should work now!

