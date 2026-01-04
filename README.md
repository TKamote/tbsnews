# ⚡ Mr Tesla Bullshit Detector

A Next.js app that aggregates and scores outrageous claims about Tesla, Elon Musk, and SpaceX from news and social media, displaying them sorted by "bullshit score" (1-10).

## 🎯 Features

- **AI-Powered Scoring**: Uses Gemini AI to analyze and score claims on a 1-10 "bullshit scale"
- **Multi-Source Aggregation**: Fetches from NewsAPI, X/Twitter, and Reddit
- **Real-Time Feed**: Displays claims sorted by bullshit score with filtering options
- **Email Authentication**: Simple sign up/sign in functionality
- **Auto-Updates**: Daily cron job fetches and processes new claims
- **Score Filtering**: Filter by High (8-10), Medium (5-7), Low (1-4), or All

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- NewsAPI key (free at [newsapi.org](https://newsapi.org))
- Gemini API key (free at [Google AI Studio](https://aistudio.google.com))

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd tbsnews
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in all required values (see [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md))

4. **Deploy Firestore rules:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore
   firebase deploy --only firestore:rules,firestore:indexes
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Test the cron job:**
   ```bash
   curl http://localhost:3000/api/cron/fetch \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📦 Deployment to Vercel

### Step 1: Push to GitHub

1. **Initialize git (if not already):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a new repository on GitHub:**
   - Go to [github.com/new](https://github.com/new)
   - Name it (e.g., `tbsnews`)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/tbsnews.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import your repository:**
   - Click "Add New..." → "Project"
   - Import your `tbsnews` repository
   - Click "Import"

3. **Configure the project:**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

4. **Add Environment Variables:**
   Click "Environment Variables" and add all variables from your `.env.local`:

   **Firebase Client:**
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

   **Firebase Admin:**
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY` (include the full key with `\n`)

   **API Keys:**
   - `NEWS_API_KEY`
   - `GEMINI_API_KEY`
   - `CRON_SECRET`

   **Optional:**
   - `X_BEARER_TOKEN` (if you have Twitter API access)

   > ⚠️ **Important**: For `FIREBASE_ADMIN_PRIVATE_KEY`, paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` with the `\n` characters.

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

### Step 3: Verify Deployment

1. **Check your live site:**
   - Vercel will provide a URL like `tbsnews.vercel.app`
   - Visit it to see your app

2. **Test the cron job:**
   ```bash
   curl https://your-app.vercel.app/api/cron/fetch \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **Verify cron schedule:**
   - Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
   - Should see "Daily at 00:00 UTC" for `/api/cron/fetch`

## 🔄 Auto-Deployment

Once connected to GitHub, Vercel automatically:
- ✅ Deploys on every push to `main` branch
- ✅ Creates preview deployments for pull requests
- ✅ Runs cron jobs on schedule (daily at midnight UTC)

**No additional setup needed!** Just push to GitHub and Vercel handles the rest.

## 📁 Project Structure

```
tbsnews/
├── src/
│   ├── app/
│   │   ├── api/cron/fetch/    # Cron job endpoint
│   │   ├── page.tsx            # Homepage
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── AuthButton.tsx      # Authentication UI
│   │   └── ClaimCard.tsx       # Claim display card
│   ├── lib/
│   │   ├── ai.ts               # AI scoring logic
│   │   ├── fetchers.ts         # Data fetching functions
│   │   └── firebase/           # Firebase config
│   └── types/
│       └── index.ts            # TypeScript types
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── vercel.json                 # Vercel configuration
└── .env.local                  # Environment variables (not in git)
```

## 🔧 Configuration

### Cron Schedule

The cron job runs daily at midnight UTC. To change:
- Edit `vercel.json` → `crons[0].schedule`
- Format: [cron expression](https://crontab.guru/)

### API Rate Limits

- **NewsAPI**: 100 requests/day (free tier)
- **Gemini**: 15 requests/minute (free tier)
- Adjust `pageSize` in `src/lib/fetchers.ts` if needed

## 📚 Documentation

- [Setup Instructions](./SETUP_INSTRUCTIONS.md) - Detailed Firebase setup guide
- [Firebase Docs](https://firebase.google.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: Google Gemini 1.5 Flash
- **Deployment**: Vercel
- **Icons**: Lucide React

## 📝 License

MIT

## ⚠️ Disclaimer

For entertainment purposes only. Not financial or investment advice.
