"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "@/lib/auth";
import { firebaseConfig } from "@/lib/firebase";

function mask(value) {
  if (!value) return "missing";
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      router.push("/");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 520, margin: "48px auto" }}>
        <h1>{isSignup ? "Create Account" : "Login"}</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Use Firebase Auth email/password.
        </p>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          Firebase check: projectId={firebaseConfig.projectId || "missing"}, apiKey={mask(firebaseConfig.apiKey)}
        </p>
        <form onSubmit={handleSubmit} className="row" style={{ marginTop: 16 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (6+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {error ? <p className="warn">{error}</p> : null}
          <button disabled={loading}>{loading ? "Loading..." : isSignup ? "Sign up" : "Login"}</button>
        </form>
        <button
          type="button"
          className="secondary"
          style={{ marginTop: 10 }}
          onClick={() => setIsSignup((v) => !v)}
        >
          {isSignup ? "Already have account? Login" : "No account? Create one"}
        </button>
      </div>
    </main>
  );
}
