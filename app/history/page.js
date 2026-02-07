"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { observeAuth, logout } from "@/lib/auth";
import { listReviews } from "@/lib/reviews";

function dateText(value) {
  if (!value?.seconds) return "pending";
  return new Date(value.seconds * 1000).toLocaleString();
}

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = observeAuth(async (nextUser) => {
      if (!nextUser) {
        router.push("/login");
        return;
      }
      setUser(nextUser);
      const result = await listReviews(nextUser.uid);
      setRows(result);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  return (
    <main>
      <div className="topbar">
        <div>
          <h1>Review History</h1>
          <p className="muted">Saved in Firestore</p>
        </div>
        <div className="topbar-actions">
          <Link href="/">
            <button type="button" className="secondary">Back</button>
          </Link>
          {user ? <button onClick={logout}>Logout</button> : null}
        </div>
      </div>

      {loading ? <p className="muted">Loading...</p> : null}

      <div className="row" style={{ marginTop: 12 }}>
        {rows.map((item) => (
          <div className="card" key={item.id}>
            <div className="topbar" style={{ marginBottom: 8 }}>
              <b>{item.resumeName || "Untitled Resume"}</b>
              <span className="badge">{item.overallScore}/100</span>
            </div>
            <p className="muted">{dateText(item.createdAt)}</p>
            <p style={{ marginTop: 8 }}><b>Strengths:</b> {(item.strengths || []).slice(0, 2).join(" / ")}</p>
            <p style={{ marginTop: 6 }}><b>Improvements:</b> {(item.improvements || []).slice(0, 2).join(" / ")}</p>
          </div>
        ))}
      </div>

      {!loading && rows.length === 0 ? <p className="muted">No reviews yet.</p> : null}
    </main>
  );
}
