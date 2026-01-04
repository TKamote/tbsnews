# Fix Permission Denied Error

The "PERMISSION_DENIED" error means your Firebase service account doesn't have the right IAM permissions.

## Solution: Grant Service Account Permissions

### Step 1: Find Your Service Account Email

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click **Service accounts** tab
5. Copy the **Service account email** (looks like: `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com`)

### Step 2: Grant IAM Permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select the same Firebase project
3. Go to **IAM & Admin** → **IAM**
4. Find your service account email (or click **+ Grant Access**)
5. Click the **pencil icon** (Edit) next to the service account
6. Add these roles:
   - **Firebase Admin SDK Administrator Service Agent** (or **Firebase Admin**)
   - **Cloud Datastore User** (for Firestore)
7. Click **Save**

### Step 3: Verify Environment Variables in Vercel

Make sure these are set correctly in Vercel:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Verify these exist:
   - `FIREBASE_ADMIN_PROJECT_ID` = your project ID
   - `FIREBASE_ADMIN_CLIENT_EMAIL` = the service account email
   - `FIREBASE_ADMIN_PRIVATE_KEY` = the full private key (with `\n` characters)

### Step 4: Check Private Key Format

The `FIREBASE_ADMIN_PRIVATE_KEY` should look like:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

**Important**: 
- Include the `\n` characters (they represent newlines)
- Include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
- The entire key should be in quotes in Vercel

### Step 5: Redeploy

After updating IAM permissions:
1. Go to Vercel → Your Project → **Deployments**
2. Click **...** on the latest deployment
3. Click **Redeploy**

### Step 6: Test Again

Click "Fetch News Now" button. Check Vercel logs if it still fails.

## Alternative: Quick Test

If you want to test if Admin SDK is working, check Vercel logs:
1. Vercel Dashboard → Your Project → **Logs**
2. Look for: "Firebase Admin initialized successfully"
3. If you see errors, they'll tell you what's wrong

## Common Issues

1. **Service account not found**: Make sure you're using the correct email from Firebase Console
2. **Wrong project**: Make sure the project ID matches in all places
3. **Private key format**: Make sure `\n` characters are preserved (not actual newlines)
4. **IAM permissions**: The service account needs Firebase Admin permissions

