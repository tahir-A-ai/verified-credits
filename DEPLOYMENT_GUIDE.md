# Full-Stack Deployment Guide: Verified Credits

Yes! You can deploy **both the Frontend and Backend on Vercel**, or use a hybrid setup (Frontend on Vercel + Backend on Render). This guide gives you the exact, step-by-step instructions for both.

---

## 🧭 Which Deployment Option Should You Choose?

| Feature | Option A: Both on Vercel (100% Vercel) | Option B: Frontend on Vercel + Backend on Render |
|---|---|---|
| **Ease of Management** | ⭐⭐⭐ Single dashboard (all on Vercel) | ⭐⭐ Two dashboards (Vercel + Render) |
| **Backend Architecture** | **Serverless Function** (spins up per request) | **Persistent Web Service** (runs 24/7 in background) |
| **Execution Timeout** | **15 seconds** max per request (Vercel Free) | **No timeout** limit |
| **Best For** | Demos, client presentations, sample batches (< 20 leads) | Heavy production batches (100+ leads with slow DNS/HTTP lookups) |
| **Cost** | 100% Free | 100% Free (sleeps after 15 min idle) |

---

## Part 1: Push Code to GitHub (Required First)

Both Vercel and Render deploy directly from GitHub.

### Step 1.1: Open PowerShell in the project root
`powershell
cd "C:\Users\tahir\Desktop\Verified Credits (SaaSquatch Leads)\verified-credits"
`

### Step 1.2: Stage & Commit
`powershell
git add .
git commit -m "feat: setup full-stack Vercel and Render deployment configs"
`

### Step 1.3: Create GitHub Repo & Push
1. Go to **[https://github.com/new](https://github.com/new)**.
2. Enter repo name: erified-credits.
3. Keep all checkboxes unchecked (**no** README, **no** .gitignore).
4. Click **Create repository**.
5. Run the push commands:
`powershell
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/verified-credits.git
git push -u origin main
`

---

## Option A: Deploy BOTH on Vercel (Step-by-Step)

Because this repository contains both /frontend and /backend, you create **two linked projects** inside your Vercel dashboard from the same GitHub repository.

### Step A.1: Deploy Backend on Vercel
1. Go to **[https://vercel.com](https://vercel.com)** and log in with GitHub.
2. Click **Add New...** → **Project**.
3. Select your erified-credits repository and click **Import**.
4. In the configuration screen:
   - **Project Name**: erified-credits-backend (or erified-credits-api)
   - **Framework Preset**: Other
   - **Root Directory**: Click **Edit** → select the ackend folder → Click **Continue**.
   - Leave Build and Output settings as default (Vercel automatically detects ercel.json, equirements.txt, and Python runtime).
5. Click **Deploy**.
6. Once deployed (~1-2 minutes), copy your live backend URL (e.g., https://verified-credits-backend.vercel.app).
   - Test in browser: https://verified-credits-backend.vercel.app/health → returns {"status":"ok"}.
   - Test docs: https://verified-credits-backend.vercel.app/docs → FastAPI Swagger UI.

---

### Step A.2: Deploy Frontend on Vercel
1. Back on the Vercel dashboard, click **Add New...** → **Project**.
2. Select the **same** erified-credits repository and click **Import**.
3. In the configuration screen:
   - **Project Name**: erified-credits (or erified-credits-web)
   - **Framework Preset**: Next.js *(auto-detected)*
   - **Root Directory**: Click **Edit** → select the rontend folder → Click **Continue**.
   - **Environment Variables**:
     - Expand **Environment Variables**.
     - **Key**: NEXT_PUBLIC_API_URL
     - **Value**: https://verified-credits-backend.vercel.app *(paste the URL from Step A.1, no trailing slash)*
     - Click **Add**.
4. Click **Deploy**.
5. In ~45 seconds, your frontend will be live at https://verified-credits.vercel.app!

---

## Option B: Frontend on Vercel + Backend on Render

If you expect users to upload larger CSVs (50+ leads), a persistent Python server on Render avoids Vercel's 15-second serverless timeout.

### Step B.1: Deploy Backend on Render
1. Go to **[https://render.com](https://render.com)** → Sign in with GitHub.
2. Click **New +** → **Web Service** → Select erified-credits.
3. Configure:
   - **Name**: erified-credits-api
   - **Root Directory**: ackend
   - **Runtime**: Python 3
   - **Build Command**: pip install -r requirements.txt
   - **Start Command**: uvicorn app.main:app --host 0.0.0.0 --port 
   - **Plan**: Free
4. Click **Deploy Web Service** and copy the live URL (e.g. https://verified-credits-api.onrender.com).

### Step B.2: Deploy Frontend on Vercel
1. Go to **[https://vercel.com](https://vercel.com)** → Import erified-credits.
2. Root Directory: rontend.
3. Add Environment Variable:
   - NEXT_PUBLIC_API_URL = https://verified-credits-api.onrender.com
4. Click **Deploy**.

---

## 🧪 Live Verification
1. Open your live Vercel frontend URL.
2. Click **"load the sample dataset instead"**.
3. Click **Validate leads** → Watch live DNS MX and phone checks run.
4. Click **Enrich (1 credit)** on any high-quality lead → Confirms wallet counter decrements from 10 to 9 and unblurs contact details.
5. Click **Download Audit CSV** → Downloads the audit export.
