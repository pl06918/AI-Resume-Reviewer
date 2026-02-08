# AI Resume Reviewer

- Firebase Auth login/signup
- Resume upload + text extraction + text input
- OpenAI API review (no ML training)
- Firestore save
- Review history page

## Stack
- Next.js (App Router)
- Firebase Auth + Firestore
- OpenAI `gpt-5-mini`

## Features
- Auth: email/password login
- Upload: resume file selector (`pdf/docx/txt/md`) with auto extraction
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

### Recommended Firestore Rules

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
If key is missing, the API route returns a heuristic fallback response.

## API
- `POST /api/extract`
- FormData: `file` (`pdf/docx/txt/md`)
- `POST /api/review`
- Request:
```json
{
  "resumeText": "...",
  "jdText": "..."
}
```

## Usage Flow
1. Login
2. Upload resume (or paste text) + paste JD
3. Run review
4. Show saved history page

## Important Note
This app is for feedback assistance, not automated hiring decisions.

## Current Scope
- GPT API-based resume review only (no model training/fine-tuning)
- Focus on stable end-to-end workflow: auth, review generation, database save, and history view

## Why This Scope
- API-based approach provides consistent output quality without dataset preparation overhead
- Lower implementation risk compared to training and deploying custom models in an early-stage product

## Challenges & Fixes
- Firebase Auth error (`auth/api-key-not-valid`): caused by malformed `.env.local` formatting. Fixed by restoring a single-line `NEXT_PUBLIC_FIREBASE_API_KEY=...` value and restarting the dev server.
- OpenAI model parameter error (`Unsupported value: 'temperature'`): `gpt-5-mini` did not accept the custom value used in code. Fixed by removing the explicit `temperature` field.
- OpenAI API setup friction: ChatGPT subscription and OpenAI API billing are separate. Resolved by creating/using the correct OpenAI Platform organization, enabling billing credits, and issuing a valid API key for `.env.local`.

## Future Work
- Build a domain-specific resume/JD dataset and add supervised evaluation pipeline
- Add lightweight model fine-tuning for keyword extraction and scoring consistency
- Compare API-only vs fine-tuned model using quantitative metrics and human review
- Optimize inference cost/latency with caching and model routing strategies
