# AI Resume Reviewer

## Team Members
- Punghwa Lee
- Mose Park

## Project Purpose
This project helps students improve their resumes quickly.  
Users upload a resume, paste a job description, and receive AI feedback with clear improvement suggestions.

## Features
- Auth: email/password login
- Upload: resume file selector (`pdf/docx/txt/md`) with auto extraction
- AI Review: strengths, weaknesses, improvements, rewritten bullets, missing keywords
- DB: save every review to Firestore
- History: view previous reviews

## Tools Utilized
- JavaScript
- Next.js (App Router) + React
- Firebase Authentication
- Cloud Firestore
- OpenAI API (`gpt-5-mini`)
- `pdf-parse` (PDF text extraction)
- `mammoth` (DOCX text extraction)
- Custom CSS (`app/globals.css`)

## Public Frameworks / APIs Credits
- [OpenAI API](https://platform.openai.com/docs) for generative feedback
- [Firebase Authentication](https://firebase.google.com/docs/auth) for login/signup
- [Cloud Firestore](https://firebase.google.com/docs/firestore) for per-user data storage
- [Next.js](https://nextjs.org/docs) and [React](https://react.dev/) for the web app framework
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) and [mammoth](https://www.npmjs.com/package/mammoth) for file parsing

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

## Problems We Ran Into and How We Solved Them
1. Firebase login error: `auth/api-key-not-valid`
- Cause: malformed `.env.local` formatting
- Fix: corrected key-value format and restarted the dev server

2. OpenAI request error with GPT-5 mini: unsupported `temperature` value
- Cause: model parameter mismatch
- Fix: removed the explicit `temperature` setting from the API call

3. OpenAI API setup confusion
- Cause: ChatGPT subscription and OpenAI API billing are separate
- Fix: set up OpenAI Platform billing/credits and generated a valid API key

## Future Work
- Collect more sample resumes and job descriptions to improve result quality
- Add clearer score breakdown (format score, keyword match score, impact score)
- Support more export options (PDF report / shareable summary)
- Improve keyword logic with simple NLP techniques and better ranking
- Add basic analytics dashboard to track usage and user feedback
- Train a small custom model later and compare it with the current API-based version.
