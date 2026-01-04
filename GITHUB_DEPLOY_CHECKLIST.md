# ✅ GitHub → Vercel Deployment Checklist

Use this checklist to ensure everything is ready for deployment.

## Pre-Deployment Checklist

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules,firestore:indexes`)
- [ ] `.env.local` file created with all values
- [ ] Local testing works (`npm run dev`)
- [ ] Cron job works locally (tested manually)

## GitHub Setup

- [ ] Repository created on GitHub
- [ ] Code committed locally
- [ ] Code pushed to GitHub (`git push`)
- [ ] `.env.local` is NOT in repository (check `.gitignore`)

## Vercel Setup

- [ ] Signed in to Vercel with GitHub
- [ ] Project imported from GitHub
- [ ] All environment variables added:

### Firebase Client (6 variables)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin (3 variables)
- [ ] `FIREBASE_ADMIN_PROJECT_ID`
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL`
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` (full key with `\n`)

### API Keys (3 variables)
- [ ] `NEWS_API_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `CRON_SECRET`

### Optional
- [ ] `X_BEARER_TOKEN` (or leave empty)

## Post-Deployment Verification

- [ ] Site loads at Vercel URL
- [ ] Authentication works (sign up/sign in)
- [ ] Cron job can be triggered manually
- [ ] Cron schedule shows in Vercel (Settings → Cron Jobs)
- [ ] Claims appear in Firebase Firestore after cron runs
- [ ] No errors in Vercel logs

## Environment Variables Reference

Copy these from your `.env.local` to Vercel:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
NEWS_API_KEY=
GEMINI_API_KEY=
CRON_SECRET=
X_BEARER_TOKEN=
```

## Quick Commands

```bash
# Check git status (should NOT show .env.local)
git status

# Commit and push
git add .
git commit -m "Ready for deployment"
git push origin main

# Test cron locally
curl http://localhost:3000/api/cron/fetch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test cron on Vercel (after deployment)
curl https://your-app.vercel.app/api/cron/fetch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Need Help?

- See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps
- See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for Firebase setup

