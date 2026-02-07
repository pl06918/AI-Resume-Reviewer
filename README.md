# AI Resume Reviewer (UGA Hackathon)

Fast MVP for EL credit:
- Firebase Auth login/signup
- Resume upload + text input
- OpenAI API review (no ML training)
- Firestore save
- Review history page

## Stack
- Next.js (App Router)
- Firebase Auth + Firestore
- OpenAI `gpt-4o-mini`

## Features (Tier 2 coverage)
- Auth: email/password login
- Upload: resume file selector (`pdf/docx/txt`), text paste recommended
- AI Review: strengths, weaknesses, improvements, rewritten bullets, missing keywords
- DB: save every review to Firestore
- History: view previous reviews

## Quick Start

```bash
cd "/Users/lph0725/Documents/AI  Resume Reviewer"
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Firebase Setup
1. Create Firebase project
2. Enable Authentication -> Email/Password
3. Create Firestore database
4. Put Firebase web config into `.env.local`

### Recommended Firestore rules (demo)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/reviews/{reviewId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## OpenAI
Set `OPENAI_API_KEY` in `.env.local`.
If key is missing, API route returns a heuristic fallback response so demo still works.

## API
- `POST /api/review`
- Request:
```json
{
  "resumeText": "...",
  "jdText": "..."
}
```

## Demo Flow (2-3 min)
1. Login
2. Paste resume + JD
3. Run review
4. Show saved history page

## Important Note
This app is for feedback assistance, not automated hiring decisions.

## Current Scope
- GPT API-based resume review only (no model training/fine-tuning in this submission)
- Focus on reliable demo delivery: auth, review generation, database save, and history view

## Why This Scope
- One-day hackathon constraint: prioritize stable implementation and clear user value
- API-based approach provides consistent output quality without dataset preparation overhead
- Lower demo risk compared to training/deployment of custom models under time pressure

## Future Work
- Build a domain-specific resume/JD dataset and add supervised evaluation pipeline
- Add lightweight model fine-tuning for keyword extraction and scoring consistency
- Compare API-only vs fine-tuned model using quantitative metrics and human review
- Optimize inference cost/latency with caching and model routing strategies
