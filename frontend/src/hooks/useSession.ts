// src/hooks/useSession.ts
"use client";
import { useEffect, useState } from "react";

export function useSession() {
  const [status, setStatus] = useState<"loading"|"authed"|"none">("loading");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/session", { cache: "no-store" });
        if (!alive) return;
        if (r.ok) {
          const j = await r.json();
          setUserId(j.userId ?? null);
          setStatus("authed");
        } else {
          setUserId(null);
          setStatus("none");
        }
      } catch {
        if (alive) { setUserId(null); setStatus("none"); }
      }
    })();
    return () => { alive = false; };
  }, []);

  return { status, userId };
}
