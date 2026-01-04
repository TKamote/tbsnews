# ⚡ Quick API Setup

## 🎯 What You Need (2 Services)

### 1. NewsAPI (5 minutes)
**URL**: [https://newsapi.org](https://newsapi.org)
1. Click "Get API Key"
2. Sign up (Google or Email)
3. Verify email
4. Copy API key from dashboard
5. Add to `.env.local`: `NEWS_API_KEY=your_key_here`

### 2. Gemini API (3 minutes)
**URL**: [https://aistudio.google.com](https://aistudio.google.com)
1. Sign in with Google
2. Click "Get API key"
3. Create API key
4. Copy key immediately
5. Add to `.env.local`: `GEMINI_API_KEY=your_key_here`

### 3. CRON_SECRET (1 minute)
- Create any random string
- Example: `my_super_secret_cron_12345`
- Add to `.env.local`: `CRON_SECRET=your_secret_here`

---

## ✅ After Registration

### Update `.env.local`
```bash
NEWS_API_KEY=your_newsapi_key
GEMINI_API_KEY=your_gemini_key
CRON_SECRET=your_random_secret
```

### Test Locally
```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/cron/fetch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Add to Vercel
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add all 3 keys
4. Redeploy

---

## 📋 Full Guide
See [API_REGISTRATION_GUIDE.md](./API_REGISTRATION_GUIDE.md) for detailed steps.

---

**Time Required**: ~10 minutes total  
**Cost**: $0 (both services have free tiers)  
**Status**: App works immediately after adding keys!

