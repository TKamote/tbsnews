# 🔑 API Registration Guide

Step-by-step instructions to register for all services needed to fetch and score Tesla/Elon news.

## Required Services

### 1. ✅ NewsAPI (Required)
**What it does**: Fetches news articles about Tesla, Elon Musk, and SpaceX  
**Free Tier**: 100 requests/day  
**Cost**: Free for development

### 2. ✅ Google Gemini API (Required)
**What it does**: AI-powered scoring of claims (1-10 "bullshit score")  
**Free Tier**: 15 requests/minute, 1,500 requests/day  
**Cost**: Free for development

### 3. ⚠️ X/Twitter API (Optional)
**What it does**: Fetches tweets about Tesla/Elon  
**Free Tier**: Very limited (1,500 tweets/month)  
**Cost**: $100/month for basic access  
**Status**: Skip for now (app works without it)

---

## 📰 Step 1: Register for NewsAPI

### 1.1 Go to NewsAPI
- Visit: [https://newsapi.org](https://newsapi.org)
- Click **"Get API Key"** (top right)

### 1.2 Sign Up
- Click **"Get Started"** or **"Sign Up"**
- Choose one:
  - **Sign up with Google** (fastest)
  - **Sign up with Email** (create account)

### 1.3 Verify Email
- Check your email inbox
- Click the verification link
- You'll be redirected to the dashboard

### 1.4 Get Your API Key
- Once logged in, you'll see your **API Key** on the dashboard
- It looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Copy this key** - you'll need it for `.env.local` and Vercel

### 1.5 Free Tier Limits
- ✅ 100 requests per day
- ✅ Development use only
- ✅ For production, you'll need a paid plan ($449/month)

### 1.6 Add to Environment Variables
Add to your `.env.local`:
```bash
NEWS_API_KEY=your_newsapi_key_here
```

---

## 🤖 Step 2: Register for Google Gemini API

### 2.1 Go to Google AI Studio
- Visit: [https://aistudio.google.com](https://aistudio.google.com)
- Sign in with your **Google account**

### 2.2 Get API Key
- Once signed in, you'll see the dashboard
- Click **"Get API key"** button (top right or in the sidebar)
- If prompted, click **"Create API key"**

### 2.3 Create API Key
- You may need to create a Google Cloud project
- Click **"Create API key in new project"** (or select existing project)
- The API key will be generated immediately
- It looks like: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`
- **Copy this key immediately** - you might not see it again!

### 2.4 Enable Gemini API (if needed)
- If you get an error, go to [Google Cloud Console](https://console.cloud.google.com)
- Navigate to **APIs & Services** → **Library**
- Search for **"Generative Language API"**
- Click **"Enable"**

### 2.5 Free Tier Limits
- ✅ 15 requests per minute
- ✅ 1,500 requests per day
- ✅ Free tier is generous for development

### 2.6 Add to Environment Variables
Add to your `.env.local`:
```bash
GEMINI_API_KEY=your_gemini_key_here
```

---

## 🐦 Step 3: X/Twitter API (Optional - Skip for Now)

### Why Skip?
- Free tier is very limited (1,500 tweets/month)
- Paid tier costs $100/month minimum
- App works perfectly with just NewsAPI + Reddit

### If You Want to Add Later:
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Apply for developer account
3. Create app and get Bearer Token
4. Add to `.env.local` as `X_BEARER_TOKEN`

**Recommendation**: Start without X/Twitter. You can add it later if needed.

---

## ✅ Step 4: Verify Your Setup

### 4.1 Update `.env.local`
Make sure your `.env.local` has all keys:
```bash
# API Keys
NEWS_API_KEY=your_newsapi_key_here
GEMINI_API_KEY=your_gemini_key_here
CRON_SECRET=your_random_secret_here

# Optional (skip for now)
X_BEARER_TOKEN=
```

### 4.2 Test Locally
1. Start dev server:
   ```bash
   npm run dev
   ```

2. Test the cron job manually:
   ```bash
   curl http://localhost:3000/api/cron/fetch \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. Check Firebase Console:
   - Go to Firestore Database
   - You should see `claims` collection with new data
   - Check `fetchLogs` for cron history

### 4.3 Add to Vercel
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add:
   - `NEWS_API_KEY` = (your NewsAPI key)
   - `GEMINI_API_KEY` = (your Gemini key)
   - `CRON_SECRET` = (same as in `.env.local`)
4. Redeploy

---

## 📊 Service Comparison

| Service | Status | Free Tier | Cost (Paid) | Required? |
|---------|--------|-----------|--------------|-----------|
| **NewsAPI** | ✅ Register | 100 req/day | $449/mo | ✅ Yes |
| **Gemini API** | ✅ Register | 1,500 req/day | Free tier generous | ✅ Yes |
| **X/Twitter** | ⏭️ Skip | 1,500 tweets/mo | $100/mo | ❌ No |

---

## 🎯 Quick Registration Checklist

- [ ] **NewsAPI**: Signed up at newsapi.org
- [ ] **NewsAPI**: Got API key from dashboard
- [ ] **NewsAPI**: Added to `.env.local` as `NEWS_API_KEY`
- [ ] **Gemini**: Signed in at aistudio.google.com
- [ ] **Gemini**: Created API key
- [ ] **Gemini**: Added to `.env.local` as `GEMINI_API_KEY`
- [ ] **CRON_SECRET**: Created random string (e.g., `my_secret_12345`)
- [ ] **Tested**: Ran cron job locally and verified it works
- [ ] **Vercel**: Added all keys to Vercel environment variables
- [ ] **Vercel**: Redeployed to activate new keys

---

## 🐛 Troubleshooting

### NewsAPI Errors

**"API key missing"**
- Check `NEWS_API_KEY` is set in `.env.local`
- Restart dev server after adding env vars

**"API key invalid"**
- Verify you copied the full key
- Check for extra spaces or quotes

**"Rate limit exceeded"**
- Free tier: 100 requests/day
- Wait 24 hours or upgrade to paid plan

### Gemini API Errors

**"API key missing"**
- Check `GEMINI_API_KEY` is set in `.env.local`
- Restart dev server after adding env vars

**"API key invalid"**
- Verify you copied the full key from AI Studio
- Make sure it starts with `AIzaSy...`

**"Quota exceeded"**
- Free tier: 15 requests/minute
- Wait a minute and try again
- Check usage in Google Cloud Console

### Testing Tips

1. **Test one service at a time**:
   - Comment out other fetchers in `src/lib/fetchers.ts`
   - Test NewsAPI first, then Gemini

2. **Check console logs**:
   - Look for error messages in terminal
   - Check browser console for client-side errors

3. **Verify API keys**:
   - Test NewsAPI: `curl "https://newsapi.org/v2/everything?q=Tesla&apiKey=YOUR_KEY"`
   - Test Gemini: Check AI Studio dashboard for usage

---

## 📚 Additional Resources

- **NewsAPI Docs**: [https://newsapi.org/docs](https://newsapi.org/docs)
- **Gemini API Docs**: [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **Firebase Docs**: [https://firebase.google.com/docs](https://firebase.google.com/docs)

---

## 🎉 You're Ready!

Once you've registered for NewsAPI and Gemini API:
1. ✅ Add keys to `.env.local`
2. ✅ Test locally
3. ✅ Add keys to Vercel
4. ✅ Redeploy
5. ✅ Cron job will run daily and fetch/scoring will work automatically!

**Next**: The cron job will automatically fetch news daily and score claims using AI. No manual work needed!

