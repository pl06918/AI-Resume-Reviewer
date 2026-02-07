"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, observeAuth } from "@/lib/auth";
import { saveReview } from "@/lib/reviews";

function safeScore(value, fallback) {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileHint, setFileHint] = useState("");
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    const unsub = observeAuth((nextUser) => {
      if (!nextUser) {
        router.push("/login");
        return;
      }
      setUser(nextUser);
    });
    return () => unsub();
  }, [router]);

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumeName(file.name);
    setFileHint("");
    setError("");

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx") && !lower.endsWith(".txt") && !lower.endsWith(".md")) {
      setFileHint("Unsupported file type. Use PDF, DOCX, TXT, or MD.");
      return;
    }

    try {
      setExtracting(true);
      setFileHint("Extracting text from file...");

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/extract", { method: "POST", body: form });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to extract text.");

      setResumeText(payload.text || "");
      setFileHint("Text extracted successfully. You can review/edit before running.");
    } catch (err) {
      setFileHint("Auto extraction failed. Paste resume text manually.");
      setError(err.message || "File extraction failed.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleReview() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jdText })
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Review failed");

      const normalized = {
        overallScore: safeScore(payload.overallScore, 70),
        strengths: payload.strengths || [],
        weaknesses: payload.weaknesses || [],
        improvements: payload.improvements || [],
        rewrittenBullets: payload.rewrittenBullets || [],
        missingKeywords: payload.missingKeywords || []
      };

      setResult(normalized);

      if (user) {
        await saveReview(user.uid, {
          resumeName: resumeName || "Pasted Resume",
          resumeText: resumeText.slice(0, 6000),
          jdText: jdText.slice(0, 3000),
          ...normalized
        });
      }
    } catch (err) {
      setError(err.message || "Review failed");
    } finally {
      setLoading(false);
    }
  }

  const tierStatus = useMemo(() => {
    if (!result) return "Ready for Tier 2 demo";
    if (result.overallScore >= 80) return "Strong candidate profile";
    if (result.overallScore >= 65) return "Needs targeted improvements";
    return "Significant revision needed";
  }, [result]);

  return (
    <main>
      <div className="topbar">
        <div>
          <h1>AI Resume Reviewer</h1>
          <p className="muted">Auth + Upload + OpenAI + Firestore History</p>
        </div>
        <div className="topbar-actions">
          <Link href="/history">
            <button type="button" className="secondary">History</button>
          </Link>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="card">
        <div className="row two">
          <div className="row">
            <h3>1) Resume Upload</h3>
            <input type="file" accept=".pdf,.docx,.txt,.md" onChange={handleFileUpload} />
            <p className="muted">{resumeName ? `Selected: ${resumeName}` : "No file selected"}</p>
            {fileHint ? <p className="muted">{fileHint}</p> : null}
            <textarea
              placeholder="Paste resume text here (recommended)"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>

          <div className="row">
            <h3>2) Job Description</h3>
            <textarea
              placeholder="Paste JD text (optional but recommended for matching)"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
            <button onClick={handleReview} disabled={loading || extracting || resumeText.trim().length < 40}>
              {extracting ? "Extracting..." : loading ? "Reviewing..." : "Run AI Review"}
            </button>
            {error ? <p className="warn">{error}</p> : null}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <p className="muted">Status</p>
        <h3 style={{ marginTop: 4 }}>{tierStatus}</h3>
      </div>

      {result ? (
        <div className="row" style={{ marginTop: 14 }}>
          <div className="card kpis">
            <div className="kpi"><p>Overall</p><b>{result.overallScore}</b></div>
            <div className="kpi"><p>Strengths</p><b>{result.strengths.length}</b></div>
            <div className="kpi"><p>Improvements</p><b>{result.improvements.length}</b></div>
            <div className="kpi"><p>Missing Keys</p><b>{result.missingKeywords.length}</b></div>
          </div>

          <div className="row two">
            <div className="card">
              <h3>Strengths</h3>
              <ul className="list">
                {result.strengths.map((item, idx) => <li key={`s-${idx}`}>{item}</li>)}
              </ul>
            </div>
            <div className="card">
              <h3>Weaknesses</h3>
              <ul className="list">
                {result.weaknesses.map((item, idx) => <li key={`w-${idx}`}>{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="row two">
            <div className="card">
              <h3>Specific Improvements</h3>
              <ul className="list">
                {result.improvements.map((item, idx) => <li key={`i-${idx}`}>{item}</li>)}
              </ul>
            </div>
            <div className="card">
              <h3>Rewritten Bullet Examples</h3>
              <ul className="list">
                {result.rewrittenBullets.map((item, idx) => <li key={`r-${idx}`}>{item}</li>)}
              </ul>
              <h3 style={{ marginTop: 10 }}>Missing Keywords</h3>
              <ul className="list">
                {result.missingKeywords.map((item, idx) => <li key={`m-${idx}`}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
