# MakeScript — Deployment Guide

## Pre-Deployment Checklist

Before deploying, verify:
- [ ] All API keys are in environment variables (NOT hardcoded in source)
- [ ] `.env.local` is listed in `.gitignore` (already done ✅)
- [ ] `config.yaml` is listed in `.gitignore` (already done ✅)
- [ ] No real keys exist in committed source files

---

## Deploy to Vercel (Recommended)

### 1. Push Code to GitHub
```bash
git add .
git commit -m "deploy: remove hardcoded keys, use env vars"
git push origin main
```

### 2. Import Project on Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo (`makescript`)
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** — it will fail on first try (no env vars yet), that's OK

### 3. Add Environment Variables on Vercel
Go to: **Project → Settings → Environment Variables**

Add each of these:

#### REQUIRED (App won't work without these)
| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Dashboard → Settings → API |
| `MODELSCOPE_API_KEY` | `ms-...` | [modelscope.cn/my/myaccesstoken](https://www.modelscope.cn/my/myaccesstoken) |
| `LIGHTNING_API_KEY` | `token/username/project` | [lightning.ai](https://lightning.ai) → Studio → API Keys |
| `LIGHTNING_API_URL` | `https://lightning.ai/api/v1/chat/completions` | (fixed value) |
| `LIGHTNING_MODEL` | `anthropic/claude-sonnet-4-6` | (fixed value) |

#### RECOMMENDED (Fallback AI providers)
| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `NVIDIA_GLM5_API_KEY` | `nvapi-...` | [build.nvidia.com](https://build.nvidia.com) → API Keys |
| `NVIDIA_MINIMAX_API_KEY` | `nvapi-...` | Same NVIDIA key works for all 3 |
| `NVIDIA_DEEPSEEK_API_KEY` | `nvapi-...` | Same NVIDIA key works for all 3 |
| `GIPHY_API_KEY` | `...` | [developers.giphy.com](https://developers.giphy.com/dashboard/) |

#### OPTIONAL
| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Direct Anthropic key (bypasses Lightning proxy) |
| `OPENAI_API_KEY` | OpenAI key |
| `GOOGLE_API_KEY` | Google Gemini key |
| `STRIPE_SECRET_KEY` | For subscriptions |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For subscriptions |
| `STRIPE_WEBHOOK_SECRET` | For subscription webhooks |
| `NEXT_PUBLIC_SITE_URL` | Your production URL (e.g. `https://makescript.vercel.app`) |

### 4. Redeploy
After adding env vars: **Deployments → ⋯ → Redeploy**

---

## Supabase Setup

### Enable Auth Providers
1. Supabase Dashboard → **Authentication → Providers**
2. Enable **Email** (required)
3. Add your Vercel deployment URL to **Site URL** and **Redirect URLs**:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/**`

### Run Database Schema
1. Supabase Dashboard → **SQL Editor**
2. Paste contents of `supabase/schema.sql`
3. Click **Run**

### Update Redirect URL After Deployment
1. Supabase → Authentication → URL Configuration
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/**`

---

## config.yaml (LiteLLM Proxy — Local Only)

The `config.yaml` file is for running a **local LiteLLM proxy** and is **git-ignored** — never committed.

If you need it to use environment variables instead of hardcoded keys:
```yaml
# Replace hardcoded keys like:
api_key: ms-your-actual-key

# With LiteLLM's env var syntax:
api_key: os.environ/MODELSCOPE_API_KEY
```

The proxy is **not needed for Vercel deployment** — the app calls AI APIs directly.

---

## Security Summary

| File | Git Status | Contains Keys? |
|------|-----------|----------------|
| `.env.local` | ❌ Ignored | ✅ Real keys (safe — not committed) |
| `config.yaml` | ❌ Ignored | ✅ Real keys (safe — not committed) |
| `.env.example` | ✅ Committed | ❌ Placeholders only |
| `src/lib/apiKeys.ts` | ✅ Committed | ❌ Only `process.env.*` references |
| `src/app/api/suggest-overlays/route.ts` | ✅ Committed | ❌ Only `process.env.*` references |

---

## Verify No Keys Leaked Before Pushing

Run this to check for any remaining hardcoded keys:
```bash
# Check for NVIDIA keys
grep -r "nvapi-" src/

# Check for ModelScope keys  
grep -r "ms-[a-f0-9-]\{30,\}" src/

# Check for Lightning keys
grep -r "c2a705e5" src/
```

All three should return **no results** — meaning all keys are safely in env vars only.

---

## Local Development

```bash
# 1. Copy example env file
cp .env.example .env.local

# 2. Fill in your actual keys in .env.local

# 3. Install dependencies
npm install

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)