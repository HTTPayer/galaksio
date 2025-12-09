"use client";

import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-zinc-900">
            Galaksio
          </Link>
          {session && (
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/dashboard"
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
              >
                Dashboard
              </Link>
              <Link
                href="https://gentle-primula-666.notion.site/Deliverable-1-Prototype-Dec-1-11-59-PM-EST-2bb6597ad8d9809faa5fe916ceb6eb5c?source=copy_link"
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
              >
                Docs
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-zinc-200" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/compute/new"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                New Project
              </Link>
              <div className="relative">
                <button
                  onClick={() => {
                    const menu = document.getElementById("user-menu");
                    if (menu) {
                      menu.classList.toggle("hidden");
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 transition-colors hover:bg-zinc-50"
                >
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium">
                    {session.user?.name || session.user?.email}
                  </span>
                  <svg
                    className="h-4 w-4 text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  id="user-menu"
                  className="absolute right-0 top-12 hidden min-w-[200px] rounded-lg border border-zinc-200 bg-white p-2 shadow-lg z-50"
                >
                  <div className="border-b border-zinc-200 px-3 py-2">
                    <p className="text-xs text-zinc-500">Signed in as</p>
                    <p className="text-sm font-medium">{session.user?.email}</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signIn("github")}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
