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
  Clock
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: "building" | "ready" | "error";
  url?: string;
  lastDeployed: string;
  framework: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("github");
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      // TODO: Fetch projects from backend
      setTimeout(() => {
        setProjects([
          {
            id: "1",
            name: "my-awesome-app",
            status: "ready",
            url: "https://my-awesome-app.galaksio.app",
            lastDeployed: new Date().toISOString(),
            framework: "Next.js",
          },
          {
            id: "2",
            name: "backend-api",
            status: "building",
            lastDeployed: new Date().toISOString(),
            framework: "Node.js",
          },
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const stats = [
    { 
      name: 'Active Deployments', 
      value: projects.filter(p => p.status === 'ready').length.toString(), 
      icon: CheckCircle,
      color: 'text-green-400'
    },
    { 
      name: 'Building', 
      value: projects.filter(p => p.status === 'building').length.toString(), 
      icon: Loader2,
      color: 'text-blue-400'
    },
    { 
      name: 'Total Projects', 
      value: projects.length.toString(), 
      icon: Rocket,
      color: 'text-purple-400'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Overview</h1>
            <p className="mt-1 text-slate-400">
              Welcome back, {session.user?.name}
            </p>
          </div>
          <Link
            href="/dashboard/compute/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-white">
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
          <h2 className="text-xl font-bold text-white mb-4">Recent Projects</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg border border-slate-800 bg-slate-900/50"
                ></div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-12 text-center">
              <Rocket className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                No projects yet
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Get started by importing a repository from GitHub
              </p>
              <Link
                href="/dashboard/compute/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Rocket className="h-4 w-4" />
                Import Project
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                      <span className="text-lg font-bold text-white">
                        {project.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          {project.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            project.status === "ready"
                              ? "bg-green-500/10 text-green-400"
                              : project.status === "building"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {project.status === "building" && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {project.status === "ready" && (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {project.status === "error" && (
                            <XCircle className="h-3 w-3" />
                          )}
                          {project.status === "ready"
                            ? "Ready"
                            : project.status === "building"
                            ? "Building"
                            : "Error"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-400">
                        <span>{project.framework}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(project.lastDeployed).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/deployments/${project.id}`}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    View Details
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
