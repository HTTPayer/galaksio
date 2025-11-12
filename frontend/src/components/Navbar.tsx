"use client";
import Link from "next/link";
import { AuthButton } from "@coinbase/cdp-react/components/AuthButton";
import { useIsSignedIn, useSolanaAddress } from "@coinbase/cdp-hooks";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Galaksio
        </Link>
        <nav className="hidden gap-6 md:flex">
          <Link href="/#features" className="hover:opacity-80">
            Features
          </Link>
          <Link href="/#how" className="hover:opacity-80">
            How it works
          </Link>
          <Link href="/#pricing" className="hover:opacity-80">
            Pricing
          </Link>
          <Link href="/docs" className="hover:opacity-80">
            Docs
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg border px-3 py-1.5 text-sm md:block"
          >
            Dashboard
          </Link>
          {/* Wrap AuthButton so we can control sizing and hover consistently with the Dashboard link */}
          <div className="cdp-auth-wrapper rounded-lg border px-3 py-1.5 text-sm">
            <AuthButton />
          </div>
          {/* Show short address when signed in to help debugging access */}
          <SignedInAddress />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-zinc-600">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <p>© {new Date().getFullYear()} Galaksio. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/legal/terms" className="hover:opacity-80">
              Terms
            </a>
            <a href="/legal/privacy" className="hover:opacity-80">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SignedInAddress() {
  const { isSignedIn } = useIsSignedIn();
  const solana = useSolanaAddress();
  const address = solana?.solanaAddress ?? null;
  if (!isSignedIn || !address) return null;
  const short = `${address.slice(0, 4)}...${address.slice(-4)}`;
  return <div className="ml-2 hidden text-sm md:block">{short}</div>;
}
