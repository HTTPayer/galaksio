// src/components/EmbeddedWalletLoader.tsx
"use client";

import { useEffect, useRef } from "react";
import { useIsSignedIn, useGetAccessToken } from "@coinbase/cdp-hooks";
import { useSession } from "@/hooks/useSession";

export default function EmbeddedWalletLoader() {
  const { isSignedIn } = useIsSignedIn();
  const { getAccessToken } = useGetAccessToken();
  const { status: serverStatus } = useSession();
  const posting = useRef(false);

  useEffect(() => {
    async function finalize() {
      // si el servidor YA está autenticado, no hagas nada
      if (serverStatus === "authed") return;

      // espera a que CDP esté firmado en cliente
      if (!isSignedIn) return;

      if (posting.current) return;
      posting.current = true;

      try {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("No access token");

        const r = await fetch("/api/siwe/complete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });

        if (r.ok) {
          // cookie lista. refresca a dashboard o vuelve a leer sesión
          window.location.href = "/dashboard";
        } else {
          console.error("siwe/complete failed", await r.text());
          posting.current = false; // permite reintento
        }
      } catch (e) {
        console.error("finalize error", e);
        posting.current = false;
      }
    }
    void finalize();
  }, [isSignedIn, getAccessToken, serverStatus]);

  return null;
}
