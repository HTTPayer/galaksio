/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CDPReactProvider, type Theme } from "@coinbase/cdp-react";
import { CDPHooksProvider } from "@coinbase/cdp-hooks";
import { useIsSignedIn } from "@coinbase/cdp-hooks";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EmbeddedWalletLoader from "./EmbeddedWalletLoader";

const theme: Partial<Theme> = {
  "colors-bg-default": "#ffffff",
  "colors-bg-alternate": "#eef0f3",
  "colors-bg-primary": "#0052ffaa",
  // CTA / primary button token: change this to the color you want for primary buttons
  "colors-cta-primary-bg-default": "#00000000",
  "colors-cta-primary-text-default": "#000",
  "colors-bg-secondary": "#eef0f3",
  "colors-fg-default": "#0a0b0d",
  "colors-fg-muted": "#5b616e",
  "colors-fg-primary": "#0052ff",
  "colors-fg-onPrimary": "#ffffff",
  "colors-fg-onSecondary": "#0a0b0d",
  "colors-fg-positive": "#098551",
  "colors-fg-negative": "#cf202f",
  "colors-fg-warning": "#ed702f",
  "colors-line-default": "#dcdfe4",
  "colors-line-heavy": "#9397a0",
  "borderRadius-cta": "var(--cdp-web-borderRadius-sm)",
  "borderRadius-link": "var(--cdp-web-borderRadius-full)",
  "borderRadius-input": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-select-trigger": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-select-list": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-modal": "var(--cdp-web-borderRadius-xl)",
  
}


interface ProvidersProps {
  children: React.ReactNode;
}

const CDP_CONFIG = {
  projectId: process.env.CDP_PROJECT_ID || "",
  solana: { createOnLogin: true },
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Galaksio", // Keep existing line for context
};

const authMethodsEnv = process.env.NEXT_PUBLIC_CDP_AUTH_METHODS || "email,sms,oauth:google,oauth:apple";
const config = {
  ...CDP_CONFIG,
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Galaksio",
  appLogoUrl: process.env.NEXT_PUBLIC_CDP_APP_LOGO || "https://httpayer.com/logo-black.png",
  authMethods: authMethodsEnv.split(",").map((s) => s.trim()).filter(Boolean),
  showCoinbaseFooter: process.env.NEXT_PUBLIC_CDP_SHOW_FOOTER === "true",
};

export default function Providers({ children }: ProvidersProps) {
  const projectId = process.env.CDP_PROJECT_ID || "";

  // If there's no CDP project id configured (common in local dev), avoid
  // initializing the real CDPReactProvider which will attempt token refresh
  // calls against Coinbase servers and can produce 401 errors. Instead just
  // mount the embed loader (which injects a dev mock) so the UI flows work
  // without network auth for local development.
  if (!projectId) {
    return (
      <>
        <EmbeddedWalletLoader />
        {children}
      </>
    );
  }

  return (
    <CDPReactProvider config={config as any} theme={theme}>
      <CDPHooksProvider config={config as any}>
        <EmbeddedWalletLoader />

        <Suspense fallback={null}>
          <AuthRedirect />
        </Suspense>
        {children}
      </CDPHooksProvider>
    </CDPReactProvider>
  );
}

function AuthRedirect() {
  // client-side helper to navigate to `next` param after sign-in
  const { isSignedIn } = useIsSignedIn();
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get("next");

  useEffect(() => {
    if (isSignedIn && next) {
      // push to the originally requested path
      router.push(next);
    }
  }, [isSignedIn, next, router]);

  return null;
}
