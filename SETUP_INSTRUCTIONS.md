# Setup Instructions

## ✅ Completed Changes

1. **Renamed `ridiculousnessScore` → `bullshitScore`** throughout the codebase
2. **Added Email Authentication** - Simple sign up/sign in/sign out
3. **Added "Last Updated" timestamp** - Shows when data was last fetched
4. **Added Score Filtering** - Filter by High (8-10), Medium (5-7), Low (1-4), or All
5. **Created Firestore Security Rules** - Ready to deploy

## 🔥 Firebase Setup Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name (e.g., "tbsnews")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database
1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Production mode** (we'll set rules separately)
4. Select a location (choose closest to you)
5. Click "Enable"

### 3. Enable Authentication
1. Go to **Build** → **Authentication**
2. Click "Get started"
3. Click on **Email/Password**
4. Enable "Email/Password" (first toggle)
5. Click "Save"

### 4. Get Firebase Client Config
1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the **Web icon** (`</>`)
4. Register app with nickname (e.g., "tbsnews-web")
5. Copy the `firebaseConfig` object values

### 5. Get Firebase Admin Credentials
1. Still in **Project Settings**
2. Go to **Service accounts** tab
3. Click "Generate new private key"
4. Download the JSON file
5. Extract these values from the JSON:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (keep the `\n` characters)

### 6. Deploy Firestore Rules
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firestore in your project:
   ```bash
   firebase init firestore
   ```
   - Use existing project
   - Select your project
   - Use existing `firestore.rules` file (yes)
   - Use existing `firestore.indexes.json` file (yes)

4. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

## 📝 Environment Variables

Create a `.env.local` file in the project root:

```bash
# Firebase Client (from step 4)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (from step 5)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# API Keys
NEWS_API_KEY=your_newsapi_key  # Get from newsapi.org (free)
GEMINI_API_KEY=your_gemini_key  # Get from Google AI Studio (free)
CRON_SECRET=any_random_string_here  # Create your own secret

# Optional (for X/Twitter - skip for now)
X_BEARER_TOKEN=
```

## 🔑 Getting API Keys

### NewsAPI Key
1. Go to [newsapi.org](https://newsapi.org)
2. Sign up for free account
3. Get your API key from dashboard
4. Free tier: 100 requests/day

### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Sign in with Google account
3. Click "Get API key"
4. Create API key
5. Free tier: 15 requests/minute

### CRON_SECRET
- Just create any random string (e.g., `my_super_secret_cron_key_12345`)
- Used to secure your cron endpoint

## 🧪 Testing Locally

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Manually trigger cron (in another terminal):**
   ```bash
   curl http://localhost:3000/api/cron/fetch \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **Check Firebase Console:**
   - Go to Firestore Database
   - You should see `claims` collection with data
   - Check `fetchLogs` collection for cron history

4. **Test Authentication:**
   - Click "Sign In" button
   - Create a new account
   - Sign in/out to verify it works

## 🚀 Deploy to Vercel

1. **Push code to GitHub** (if not already)

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add all environment variables from `.env.local`
   - Deploy

3. **Set up Vercel Cron:**
   - Cron is already configured in `vercel.json`
   - Runs daily at midnight UTC
   - Make sure `CRON_SECRET` is set in Vercel env vars

## 📋 Firestore Rules Summary

The rules file (`firestore.rules`) allows:
- ✅ **Public read** for `claims` (anyone can view the feed)
- ✅ **Server-only write** for `claims` (only cron job can add claims)
- ✅ **User read/write** for `users` (users can manage their own data)
- ✅ **Authenticated read** for `fetchLogs` (users can see last updated time)

## 🎯 What's New

### Authentication
- Sign up with email/password
- Sign in/sign out
- User email displayed when logged in
- Auth button in header

### Filtering
- Filter claims by BS score:
  - **All** - Shows everything
  - **High (8-10)** - Most ridiculous claims
  - **Medium (5-7)** - Moderately absurd
  - **Low (1-4)** - Less ridiculous

### Last Updated
- Shows when data was last fetched
- Updates automatically
- Format: "Xh ago" or "Xm ago"

## ⚠️ Important Notes

1. **Firestore Indexes**: The composite indexes might need to be created manually if Firestore prompts you. Check the Firebase Console for any index creation prompts.

2. **First Cron Run**: The first time you run the cron, it might take longer as it processes all fetched items.

3. **Rate Limits**: 
   - NewsAPI: 100 requests/day (free tier)
   - Gemini: 15 requests/minute (free tier)
   - Adjust `pageSize` in fetchers if needed

4. **X/Twitter**: Currently skipped if `X_BEARER_TOKEN` is not set. Add it later when you have Twitter API access.

## 🐛 Troubleshooting

**"Firebase Admin not configured"**
- Check that all `FIREBASE_ADMIN_*` env vars are set
- Make sure `FIREBASE_ADMIN_PRIVATE_KEY` includes the `\n` characters

**"Firebase not configured"**
- Check that all `NEXT_PUBLIC_FIREBASE_*` env vars are set
- Restart dev server after adding env vars

**"Permission denied" in Firestore**
- Make sure you deployed Firestore rules: `firebase deploy --only firestore:rules`

**No claims showing**
- Run the cron manually to fetch data
- Check Firestore Console to see if claims were saved
- Check browser console for errors

