"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { 
  Rocket, 
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Code2,
  Database
} from "lucide-react";

interface JobRecord {
  id: string;
  brokerJobId: string;
  kind: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("github");
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      loadJobs();
    }
  }, [session]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to load jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-950" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const computeJobs = jobs.filter(j => j.kind === 'run');
  const storageJobs = jobs.filter(j => j.kind === 'store');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  const stats = [
    { 
      name: 'Compute Jobs', 
      value: computeJobs.length.toString(), 
      icon: Code2,
      color: 'text-blue-950'
    },
    { 
      name: 'Stored Files', 
      value: storageJobs.length.toString(), 
      icon: Database,
      color: 'text-blue-950'
    },
    { 
      name: 'Completed', 
      value: completedJobs.length.toString(), 
      icon: CheckCircle,
      color: 'text-green-600'
    },
    { 
      name: 'Total Jobs', 
      value: jobs.length.toString(), 
      icon: Rocket,
      color: 'text-zinc-700'
    },
  ];

  return (
    <div className="bg-white">
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Overview</h1>
            <p className="mt-1 text-zinc-600">
              Welcome back, {session.user?.name}
            </p>
          </div>
          <Link
            href="/dashboard/compute/new"
            className="flex items-center text-stone-50 gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-blue-900"
          >
            <Rocket className="h-4 w-4" />
            New Import
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="rounded-lg border border-zinc-200 bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-zinc-900">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Recent Jobs</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg border border-zinc-200 bg-zinc-50"
                ></div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
              <Rocket className="mx-auto h-12 w-12 text-zinc-400" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                No jobs yet
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Run code or upload files to get started
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/dashboard/compute/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-900"
                >
                  <Code2 className="h-4 w-4" />
                  Run Code
                </Link>
                <Link
                  href="/dashboard/storage"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
                >
                  <Database className="h-4 w-4" />
                  Upload File
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 10).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      job.kind === 'run' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {job.kind === 'run' ? (
                        <Code2 className="h-5 w-5 text-blue-950" />
                      ) : (
                        <Database className="h-5 w-5 text-green-700" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-zinc-900">
                          {job.kind === 'run' ? 'Compute Job' : 'Storage Job'}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            job.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : job.status === "running"
                              ? "bg-blue-100 text-blue-700"
                              : job.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {job.status === "running" && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {job.status === "completed" && (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {job.status === "error" && (
                            <XCircle className="h-3 w-3" />
                          )}
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(job.createdAt).toLocaleString()}
                        </span>
                        <span>•</span>
                        <code className="text-xs">{job.brokerJobId.substring(0, 8)}...</code>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={job.kind === 'run' ? '/dashboard/compute/new' : '/dashboard/storage'}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
