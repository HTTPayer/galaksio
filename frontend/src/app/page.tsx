"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="bg-white">
      {/* Hero Section with Space Theme */}
      <section className="relative overflow-hidden border-b border-zinc-200">
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-32">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
            {/* Left Content */}
            <div className="lg:w-1/2">
              {/* Badge */}
              <Link
                href="#whats-new"
                className="inline-flex items-center gap-2 rounded-full border border-blue-900/20 bg-blue-950/5 px-3 py-1 text-sm text-blue-950 transition-colors hover:bg-blue-950/10"
              >
                <span className="font-medium">What&apos;s new</span>
                <span className="text-zinc-600">HTTPayer x402 Integration</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Main Heading */}
              <h1 className="mt-8 text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
                On-chain USDC
                <span className="block bg-gradient-to-r from-blue-950 via-blue-900 to-slate-800 bg-clip-text text-transparent">
                  Meets Cloud Compute
                </span>
              </h1>

              {/* Description */}
              <p className="mt-6 text-lg leading-8 text-zinc-700">
                Pay-as-you-go cloud infrastructure powered by HTTPayer. Execute scripts, run AI workloads, and store results—all paid with USDC, accessed through simple HTTP calls.
              </p>
              <p className="mt-3 text-base text-zinc-600">
                No wallets. No accounts. No gas calculations. Just instant compute on Akash, permanent storage on Arweave, and payments handled automatically via the x402 standard.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                {session ? (
                  <Link
                    href="/new"
                    className="rounded-lg bg-blue-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-900 hover:shadow-lg"
                  >
                    Deploy your first project
                  </Link>
                ) : (
                  <button
                    onClick={() => signIn("github")}
                    className="flex items-center gap-2 rounded-lg bg-blue-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-900 hover:shadow-lg"
                  >
                    Deploy your first project
                  </button>
                )}
                <Link
                  href="#features"
                  className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-50"
                >
                  How it works
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Right Screenshot Card */}
            <div className="mt-16 lg:mt-0 lg:w-1/2">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-blue-950/10 via-blue-900/10 to-slate-800/10 opacity-75 blur-2xl"></div>
                
                {/* Main Card */}
                <div className="relative rounded-xl border border-zinc-200 bg-white shadow-2xl">
                  {/* Browser Chrome */}
                  <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="ml-4 flex-1 rounded bg-zinc-100 px-3 py-1 text-xs text-zinc-500">
                      galaksio.cloud
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="flex">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-zinc-200 bg-zinc-50 p-4">
                      <div className="mb-6">
                        <div className="text-lg font-bold text-blue-950">Galaksio</div>
                      </div>
                      <nav className="space-y-1">
                        <div className="text-xs font-semibold text-zinc-500">Navigation</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-700">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            Projects
                          </div>
                          <div className="flex items-center gap-2 rounded bg-blue-950 px-2 py-1.5 text-sm font-medium text-white">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Deployments
                          </div>
                          <div className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-700">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Activity
                          </div>
                        </div>
                        <div className="mt-4 text-xs font-semibold text-zinc-500">Your teams</div>
                        <div className="mt-2 space-y-1">
                          <div className="px-2 py-1 text-sm text-zinc-600">Planetario</div>
                          <div className="px-2 py-1 text-sm text-zinc-600">Protocol</div>
                        </div>
                      </nav>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-zinc-900">Deployments</h2>
                      </div>
                      <div className="space-y-3">
                        {/* Deployment Items */}
                        <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-100 text-xs font-bold text-zinc-600">
                              P
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-900">Planetario</div>
                              <div className="text-xs text-zinc-500">Deploy from GitHub</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-600"></div>
                              Ready
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-100 text-xs font-bold text-zinc-600">
                              T
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-900">Tailwind Labs</div>
                              <div className="text-xs text-zinc-500">Deploy from GitHub</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-600"></div>
                              Building
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-100 text-xs font-bold text-zinc-600">
                              P
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-900">Protocol</div>
                              <div className="text-xs text-zinc-500">Deploy from GitHub</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
                              Failed
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b border-zinc-200 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Web3 Resources via HTTP
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Powered by HTTPayer and the x402 Payment Required standard
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              }
              title="Decentralized Sandboxes"
              description="Run scripts or AI jobs securely in Akash, E2B, or similar decentralized compute environments."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              }
              title="Permanent Storage"
              description="Store data and results on Arweave for permanence or IPFS/Filecoin for ephemeral caching."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="Pay-as-You-Go USDC"
              description="Pay only for what you use via HTTPayer. No wallets for end users, just simple HTTP calls."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              title="GitHub Integration"
              description="Connect your repositories and deploy automatically with seamless GitHub integration."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="x402 Standard"
              description="Built on the emerging x402 Payment Required standard for Web3 resource access."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Real-time Analytics"
              description="Monitor your deployments with detailed insights, logs, and HTTPayer Response Groups."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-b border-zinc-200 bg-zinc-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Unified pay-as-you-go flow powered by HTTPayer
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="space-y-6">
              <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Service returns 402 Payment Required
                  </h3>
                  <p className="mt-2 text-zinc-600">
                    HTTPayer automatically handles the USDC payment on-chain
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-600">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Job runs in secure sandbox
                  </h3>
                  <p className="mt-2 text-zinc-600">
                    Your script or AI job executes on Akash, E2B, or similar decentralized compute
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-600">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Output stored permanently
                  </h3>
                  <p className="mt-2 text-zinc-600">
                    Results saved to Arweave for permanence or IPFS/Filecoin for ephemeral storage
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Logs and monitoring available
                  </h3>
                  <p className="mt-2 text-zinc-600">
                    Access detailed logs via HTTPayer Response Groups and real-time analytics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Import your GitHub repositories and start deploying with on-chain USDC payments via HTTPayer.
            </p>
            <div className="mt-10">
              {session ? (
                <Link
                  href="/new"
                  className="rounded-lg bg-black px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800"
                >
                  Import Your First Project
                </Link>
              ) : (
                <button
                  onClick={() => signIn("github")}
                  className="flex items-center gap-2 rounded-lg bg-black px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Get Started with GitHub
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-6 transition-all hover:border-zinc-300 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
    </div>
  );
}

