# 🚀 Deployment Guide: GitHub → Vercel

This guide walks you through deploying the Mr Tesla Bullshit Detector to production with automatic deployments from GitHub.

## Prerequisites

- ✅ Firebase project set up
- ✅ Firestore rules deployed
- ✅ Authentication enabled
- ✅ `.env.local` file created with all values
- ✅ Code ready to commit

## Step 1: Prepare Repository for GitHub

### 1.1 Verify .gitignore

Make sure `.env.local` is ignored (should already be in `.gitignore`):

```bash
cat .gitignore | grep .env
```

Should show: `.env*`

### 1.2 Check for Sensitive Files

Make sure you haven't committed any sensitive files:

```bash
git status
```

You should NOT see:
- `.env.local`
- `firebase-adminsdk-*.json`
- Any API keys in code

### 1.3 Create Initial Commit (if not done)

```bash
git add .
git commit -m "Initial commit: Mr Tesla Bullshit Detector"
```

## Step 2: Create GitHub Repository

### 2.1 Create New Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `tbsnews` (or your preferred name)
3. **Description**: "Mr Tesla Bullshit Detector - AI-powered claim scoring app"
4. **Visibility**: 
   - Choose **Public** (if you want it visible)
   - Or **Private** (if you want it private)
5. **DO NOT** check:
   - ❌ Add a README file (we already have one)
   - ❌ Add .gitignore (we already have one)
   - ❌ Choose a license (optional, add later if needed)
6. Click **"Create repository"**

### 2.2 Push Your Code

GitHub will show you commands. Run these:

```bash
# If you haven't initialized git yet
git init
git add .
git commit -m "Initial commit"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/tbsnews.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 3: Deploy to Vercel

### 3.1 Sign In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### 3.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. You'll see your GitHub repositories
3. Find **`tbsnews`** and click **"Import"**

### 3.3 Configure Project

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: `Next.js` ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

Click **"Deploy"** (we'll add env vars next, but you can start the build).

### 3.4 Add Environment Variables

**IMPORTANT**: You must add ALL environment variables from your `.env.local` file.

1. In Vercel project, go to **Settings** → **Environment Variables**
2. Add each variable one by one:

#### Firebase Client Variables

Click **"Add New"** for each:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (from your .env.local) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | (from your .env.local) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | (from your .env.local) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | (from your .env.local) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (from your .env.local) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | (from your .env.local) |

#### Firebase Admin Variables

| Key | Value |
|-----|-------|
| `FIREBASE_ADMIN_PROJECT_ID` | (from your .env.local) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | (from your .env.local) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | (from your .env.local) - **Include full key with \n** |

⚠️ **For `FIREBASE_ADMIN_PRIVATE_KEY`**: 
- Copy the ENTIRE value from `.env.local`
- It should look like: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
- Keep the quotes and `\n` characters

#### API Keys

| Key | Value |
|-----|-------|
| `NEWS_API_KEY` | (from your .env.local) |
| `GEMINI_API_KEY` | (from your .env.local) |
| `CRON_SECRET` | (from your .env.local) |

#### Optional

| Key | Value |
|-----|-------|
| `X_BEARER_TOKEN` | (leave empty if not using Twitter) |

3. For each variable, select environments:
   - ✅ **Production**
   - ✅ **Preview** (optional, for PR previews)
   - ✅ **Development** (optional, for local dev)

4. Click **"Save"** after adding each variable

### 3.5 Redeploy with Environment Variables

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **"..."** → **"Redeploy"**
4. This will rebuild with all environment variables

## Step 4: Verify Deployment

### 4.1 Check Live Site

1. Vercel provides a URL like: `tbsnews.vercel.app`
2. Visit it in your browser
3. You should see the homepage

### 4.2 Test Authentication

1. Click **"Sign In"** button
2. Create a test account
3. Verify sign in/out works

### 4.3 Test Cron Job

Run this command (replace with your actual URL and secret):

```bash
curl https://tbsnews.vercel.app/api/cron/fetch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

You should get a JSON response with:
```json
{
  "success": true,
  "fetched": 10,
  "processed": 5,
  "duration": 12345
}
```

### 4.4 Verify Cron Schedule

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Cron Jobs**
3. You should see:
   - **Path**: `/api/cron/fetch`
   - **Schedule**: `0 0 * * *` (Daily at 00:00 UTC)

## Step 5: Set Up Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration instructions
4. Vercel will automatically configure SSL

## 🔄 Auto-Deployment is Now Active!

From now on:
- ✅ **Every push to `main`** → Auto-deploys to production
- ✅ **Every pull request** → Creates preview deployment
- ✅ **Cron jobs** → Run automatically on schedule

## 🐛 Troubleshooting

### Build Fails

**Error**: "Environment variable not found"
- **Fix**: Make sure all env vars are added in Vercel Settings → Environment Variables

**Error**: "Firebase Admin not configured"
- **Fix**: Check `FIREBASE_ADMIN_PRIVATE_KEY` includes full key with `\n` characters

**Error**: "Module not found"
- **Fix**: Make sure `package.json` has all dependencies, run `npm install` locally first

### Cron Job Not Running

1. Check **Settings** → **Cron Jobs** in Vercel
2. Verify the schedule is correct
3. Check Vercel logs for errors
4. Manually trigger: `curl https://your-app.vercel.app/api/cron/fetch -H "Authorization: Bearer YOUR_SECRET"`

### Site Not Loading

1. Check **Deployments** tab for build errors
2. Check browser console for errors
3. Verify all `NEXT_PUBLIC_*` env vars are set
4. Check Firebase Console for Firestore rules

### Authentication Not Working

1. Verify Firebase Auth is enabled in Firebase Console
2. Check `NEXT_PUBLIC_FIREBASE_*` env vars are correct
3. Check browser console for Firebase errors
4. Verify Firestore rules allow user writes

## 📊 Monitoring

### Vercel Analytics

1. Go to **Analytics** tab in Vercel
2. Enable Analytics (free tier available)
3. Monitor traffic and performance

### Firebase Console

1. Check **Firestore** → See claims being added
2. Check **Authentication** → See user sign-ups
3. Check **Usage** → Monitor free tier limits

### Logs

- **Vercel Logs**: Dashboard → Your Project → Logs
- **Firebase Logs**: Firebase Console → Functions → Logs (if using Cloud Functions)

## 🎉 Success!

Your app is now:
- ✅ Deployed to production
- ✅ Auto-deploying from GitHub
- ✅ Running cron jobs automatically
- ✅ Accessible worldwide

## Next Steps

1. **Share your app**: Tell people about it!
2. **Monitor usage**: Watch Firebase and API rate limits
3. **Iterate**: Push updates to GitHub, they auto-deploy
4. **Scale**: Upgrade Firebase/Vercel plans if needed

---

**Need help?** Check:
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

