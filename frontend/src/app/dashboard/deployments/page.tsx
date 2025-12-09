"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  Eye,
  Calendar,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface JobRecord {
  id: string;
  brokerJobId: string;
  kind: string;
  status: string;
  stdout: string | null;
  stderr: string | null;
  exitCode: number | null;
  executionTimeMs: number | null;
  txId: string | null;
  url: string | null;
  provider: string | null;
  size: number | null;
  createdAt: string;
  updatedAt: string;
  rawResult: Record<string, unknown> | null;
}

export default function DeploymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      console.error("Error loading jobs:", error);
      toast.error("Failed to load deployments");
    } finally {
      setLoading(false);
    }
  };

  const refreshAllJobs = async () => {
    setRefreshing(true);
    try {
      await loadJobs();
      toast.success("Jobs refreshed");
    } catch (error) {
      console.error("Error refreshing jobs:", error);
      toast.error("Failed to refresh jobs");
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
      case 'executing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'queued':
      case 'awaiting_payment':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'running':
      case 'executing':
        return 'default';
      case 'queued':
      case 'awaiting_payment':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Calculate stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => 
    ['running', 'executing', 'queued', 'awaiting_payment'].includes(j.status.toLowerCase())
  ).length;
  const completedJobs = jobs.filter(j => j.status.toLowerCase() === 'completed').length;
  const failedJobs = jobs.filter(j => j.status.toLowerCase() === 'failed').length;

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Deployments Dashboard</h1>
          <p className="text-zinc-600 mt-2">
            Monitor and manage your code executions and storage deployments
          </p>
        </div>
        <Button onClick={refreshAllJobs} variant="outline" size="sm" disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh All
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Total Jobs</CardTitle>
            <Activity className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{totalJobs}</div>
            <p className="text-xs text-zinc-500 mt-1">All deployments</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Active</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{activeJobs}</div>
            <p className="text-xs text-blue-700 mt-1">Running or queued</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{completedJobs}</div>
            <p className="text-xs text-green-700 mt-1">Successfully executed</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{failedJobs}</div>
            <p className="text-xs text-red-700 mt-1">Execution errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deployments</CardTitle>
          <CardDescription>
            Your latest code executions and storage deployments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 mb-2">No deployments yet</h3>
              <p className="text-zinc-500 mb-4">
                Start by executing code or uploading files
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} className="border-zinc-200 hover:border-zinc-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {getStatusIcon(job.status)}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getStatusBadgeVariant(job.status)} className="font-medium">
                              {job.status}
                            </Badge>
                            <Badge variant="outline" className="font-mono text-xs">
                              {job.kind}
                            </Badge>
                            {job.exitCode !== null && job.exitCode !== undefined && (
                              <Badge variant={job.exitCode === 0 ? "default" : "destructive"} className="text-xs">
                                Exit: {job.exitCode}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-zinc-900">
                              Job ID: <span className="font-mono text-zinc-600">{job.brokerJobId}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(job.createdAt).toLocaleString()}
                            </div>
                            {job.provider && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {job.provider}
                              </div>
                            )}
                            {job.executionTimeMs && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {(job.executionTimeMs / 1000).toFixed(2)}s
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/deployments/${job.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
