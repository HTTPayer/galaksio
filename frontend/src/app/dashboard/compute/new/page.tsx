"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  updated_at: string;
  language: string | null;
  default_branch: string;
}

export default function NewProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("github");
    }
  }, [status]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchRepos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRepos(data);
      }
    } catch (error) {
      console.error("Error fetching repos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (repo: GitHubRepo) => {
    setImporting(repo.id);
    
    // TODO: Aquí conectarás con tu backend
    // const response = await fetch("/api/projects/import", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     repoUrl: repo.html_url,
    //     repoName: repo.name,
    //     branch: repo.default_branch,
    //   }),
    // });

    // Simulación por ahora
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setImporting(null);
    router.push("/dashboard");
  };

  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      repo.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Import Git Repository</h1>
          <p className="mt-2 text-zinc-600">
            Select a repository from your GitHub account to import and deploy.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 pl-11 text-sm outline-none transition-colors focus:border-zinc-400"
            />
            <svg
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Repositories List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg border border-zinc-200 bg-white"
              ></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRepos.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
                <p className="text-zinc-600">No repositories found.</p>
              </div>
            ) : (
              filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-zinc-900">
                        {repo.name}
                      </h3>
                      {repo.private && (
                        <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600">
                          Private
                        </span>
                      )}
                      {repo.language && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {repo.language}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-zinc-600">
                      {repo.description || "No description provided"}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                      <span>
                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{repo.default_branch}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleImport(repo)}
                    disabled={importing !== null}
                    className="ml-6 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {importing === repo.id ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Importing...
                      </span>
                    ) : (
                      "Import"
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Import from URL */}
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            Or import from Git URL
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Import a Git repository from any provider
          </p>
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              placeholder="https://github.com/username/repo"
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none transition-colors focus:border-zinc-400"
            />
            <button className="rounded-lg bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
