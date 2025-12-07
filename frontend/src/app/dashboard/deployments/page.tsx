'use client';

import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Rocket, 
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  ExternalLink,
  GitBranch,
  Activity
} from 'lucide-react';

interface Deployment {
  id: string;
  project_name: string;
  status: 'building' | 'ready' | 'error';
  url?: string;
  created_at: string;
  updated_at: string;
  framework: string;
  branch: string;
  commit_sha: string;
  commit_message: string;
}

export default function DeploymentsPage() {
  const { data: session, status } = useSession();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('github');
    }
  }, [status]);

  const loadDeployments = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/deployments');
      // const data = await response.json();
      // setDeployments(data);
      
      // Mock data
      setTimeout(() => {
        setDeployments([
          {
            id: '1',
            project_name: 'my-awesome-app',
            status: 'ready',
            url: 'https://my-awesome-app.galaksio.app',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            framework: 'Next.js',
            branch: 'main',
            commit_sha: 'abc123',
            commit_message: 'Initial deployment'
          },
          {
            id: '2',
            project_name: 'backend-api',
            status: 'building',
            created_at: new Date(Date.now() - 300000).toISOString(),
            updated_at: new Date().toISOString(),
            framework: 'Node.js',
            branch: 'develop',
            commit_sha: 'def456',
            commit_message: 'Add new endpoints'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading deployments:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadDeployments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statusConfig = {
    ready: {
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      label: 'Ready',
      animate: false
    },
    building: {
      icon: Loader2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      label: 'Building',
      animate: true
    },
    error: {
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      label: 'Error',
      animate: false
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Deployments</h1>
            <p className="mt-1 text-slate-400">
              Monitor and manage your application deployments
            </p>
          </div>
          <Link
            href="/dashboard/compute/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Rocket className="h-4 w-4" />
            New Deployment
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {deployments.filter(d => d.status === 'ready').length}
                </p>
                <p className="text-sm text-slate-400">Active</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {deployments.filter(d => d.status === 'building').length}
                </p>
                <p className="text-sm text-slate-400">Building</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {deployments.filter(d => d.status === 'error').length}
                </p>
                <p className="text-sm text-slate-400">Failed</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {deployments.length}
                </p>
                <p className="text-sm text-slate-400">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deployments List */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Deployments</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-lg border border-slate-800 bg-slate-900/50"
                />
              ))}
            </div>
          ) : deployments.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-12 text-center">
              <Rocket className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                No deployments yet
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Start by importing a project from GitHub
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
              {deployments.map((deployment) => {
                const config = statusConfig[deployment.status];
                const StatusIcon = config.icon;
                
                return (
                  <div
                    key={deployment.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {deployment.project_name}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border ${config.border} ${config.bg} px-3 py-1 text-xs font-medium ${config.color}`}
                          >
                            <StatusIcon 
                              className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''}`} 
                            />
                            {config.label}
                          </span>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-6 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <GitBranch className="h-3.5 w-3.5" />
                            {deployment.branch}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(deployment.updated_at).toLocaleString()}
                          </span>
                          <span>{deployment.framework}</span>
                        </div>
                        
                        <p className="mt-2 text-sm text-slate-500">
                          {deployment.commit_message}
                        </p>
                        
                        {deployment.url && (
                          <a
                            href={deployment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {deployment.url}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/deployments/${deployment.id}`}
                          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
