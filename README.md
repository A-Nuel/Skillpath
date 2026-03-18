# SkillPath 🧭

> An AI-powered digital skill advisor that diagnoses your personality, strengths, and goals — then recommends the exact skill you should learn, with a full roadmap to get paid.

![SkillPath](https://img.shields.io/badge/Powered%20by-Gemini%201.5%20Flash-blue?style=flat-square) ![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## What is SkillPath?

Most people trying to learn a digital skill make one critical mistake — they pick a skill based on what's trending, not what actually fits them. They start, lose motivation, and quit.

SkillPath fixes that.

It runs a **15-question conversational assessment** powered by Gemini AI. Instead of a generic quiz, it holds a real back-and-forth conversation — reacting to your answers, asking follow-up questions, and connecting the dots across your personality, background, goals, and situation.

By the end, it knows you well enough to make a recommendation that actually fits.

---

## What You Get

After 15 questions, SkillPath generates a fully personalised result:

- **Skill recommendation** with a personal explanation referencing your exact answers
- **Fit score** showing how well the skill matches your profile
- **Income potential** across beginner, intermediate, and expert levels
- **Time to first paid work** — realistic, not optimistic
- **4-phase learning roadmap** with specific actions per phase
- **5 curated resources** (mix of free and paid) to start immediately
- **Warning sign** — one honest trap to watch out for
- **Alternative skill** in case the primary recommendation doesn't click

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| AI | Google Gemini 1.5 Flash |
| Backend | Vercel Edge Serverless Function |
| Hosting | Vercel |

---

## Project Structure

```
skillpath/
  index.html        # Full frontend — dark UI, conversational chat interface
  vercel.json       # Vercel routing config
  api/
    chat.js         # Serverless function — proxies requests to Gemini API
```

---

## Running Locally

**1. Clone the repo**
```bash
git clone https://github.com/A-Nuel/Skillpath.git
cd Skillpath
```

**2. Get a free Gemini API key**

Go to [aistudio.google.com](https://aistudio.google.com) → Get API Key → Create API Key. No billing card required.

**3. Install Vercel CLI**
```bash
npm install -g vercel
```

**4. Add your API key as an environment variable**
```bash
echo "GEMINI_API_KEY=your_key_here" > .env.local
```

**5. Run locally**
```bash
vercel dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel

**1. Push this repo to GitHub** (already done if you're reading this)

**2. Import on Vercel**

Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo → Deploy

**3. Add your environment variable**

Vercel Dashboard → Your Project → Settings → Environment Variables

```
Name:   GEMINI_API_KEY
Value:  your_key_from_aistudio
```

**4. Redeploy**

Vercel Dashboard → Deployments → Redeploy

Your live URL will be `yourproject.vercel.app` ✓

---

## How the AI Works

The frontend sends the full conversation history to `/api/chat` on every turn. The serverless function forwards it to Gemini 1.5 Flash with a detailed system prompt containing a **57-dimension diagnostic framework** covering:

- Identity & personality
- Interest & curiosity signals
- Money goals & urgency
- Current skills & background
- Work style & energy
- Tech comfort level
- Risk & growth mindset
- Output preference
- Reality check (devices, discipline, blockers)

Gemini uses this framework to decide what to ask next — adapting dynamically to each answer rather than following a fixed script. After turn 15, it generates the full personalised result.

The API key never touches the frontend. It lives only in Vercel's encrypted environment variables.

---

## API Key Safety

This repo is public and safe to share because:

- The Gemini API key is stored **only** in Vercel's environment variables
- The `api/chat.js` serverless function reads it via `process.env.GEMINI_API_KEY`
- It is **never** written into any file in this repo
- Anyone who clones this repo cannot make API calls without their own key

---

## Built By

**0xNuel** — [0xnuel.vercel.app](https://0xnuel.vercel.app)

---

## License

MIT — free to use, fork, and build on.
