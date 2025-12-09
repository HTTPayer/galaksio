"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ExternalLink,
  Calendar,
  Zap,
  AlertCircle,
  Terminal,
  Database,
  Activity,
  ChevronDown,
  ChevronRight,
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

// Parse console output into categorized lines
interface ParsedLine {
  text: string;
  type: 'error' | 'warning' | 'success' | 'info' | 'normal';
}

interface LogSection {
  title: string;
  lines: ParsedLine[];
  type: 'docker' | 'execution' | 'output';
}

function parseConsoleOutput(output: string): LogSection[] {
  const lines = output.split('\n');
  const sections: LogSection[] = [];
  let currentSection: LogSection | null = null;
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parsedLine: ParsedLine = {
      text: line,
      type: 'normal'
    };
    
    // Detect line type
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('error') || lowerLine.includes('failed') || lowerLine.includes('exception')) {
      parsedLine.type = 'error';
    } else if (lowerLine.includes('warning') || lowerLine.includes('warn')) {
      parsedLine.type = 'warning';
    } else if (lowerLine.includes('success') || lowerLine.includes('complete') || lowerLine.includes('✓')) {
      parsedLine.type = 'success';
    } else if (lowerLine.includes('pulling') || lowerLine.includes('downloading') || lowerLine.includes('extracting')) {
      parsedLine.type = 'info';
    }
    
    // Categorize into sections
    if (line.includes('Pulling Docker image') || line.includes('Pulling from')) {
      if (currentSection?.type !== 'docker') {
        currentSection = { title: '🐳 Docker Image Pull', lines: [], type: 'docker' };
        sections.push(currentSection);
      }
      currentSection.lines.push(parsedLine);
    } else if (line.includes('Successfully pulled') || (currentSection?.type === 'docker' && line.includes('Digest:'))) {
      if (currentSection?.type === 'docker') {
        currentSection.lines.push(parsedLine);
      }
    } else if (line.includes('Hello from') || line.includes('Factorial')) {
      if (currentSection?.type !== 'output') {
        currentSection = { title: '📄 Program Output', lines: [], type: 'output' };
        sections.push(currentSection);
      }
      currentSection.lines.push(parsedLine);
    } else if (currentSection) {
      currentSection.lines.push(parsedLine);
    } else {
      currentSection = { title: '⚡ Execution Log', lines: [], type: 'execution' };
      sections.push(currentSection);
      currentSection.lines.push(parsedLine);
    }
  }
  
  return sections;
}

function ConsoleLineComponent({ line }: { line: ParsedLine }) {
  const getLineStyles = () => {
    switch (line.type) {
      case 'error':
        return 'bg-red-500/10 border-l-2 border-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500/10 border-l-2 border-yellow-500 text-yellow-200';
      case 'success':
        return 'bg-green-500/10 border-l-2 border-green-500 text-green-200';
      case 'info':
        return 'bg-blue-500/10 border-l-2 border-blue-500 text-blue-200';
      default:
        return 'bg-transparent text-zinc-300';
    }
  };
  
  const getIcon = () => {
    switch (line.type) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-400 flex-shrink-0" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />;
      default:
        return null;
    }
  };
  
  return (
    <div className={`px-4 py-2 font-mono text-xs leading-relaxed border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors ${getLineStyles()}`}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <span className="flex-1">{line.text}</span>
      </div>
    </div>
  );
}

export default function DeploymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1, 2])); // All expanded by default

  const jobId = params?.jobId as string;

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("github");
    }
  }, [status]);

  useEffect(() => {
    if (session && jobId) {
      loadJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, jobId]);

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const loadJob = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to load jobs');
      const jobs = await response.json();
      const foundJob = jobs.find((j: JobRecord) => j.id === jobId);
      
      if (!foundJob) {
        toast.error("Job not found");
        router.push('/dashboard/deployments');
        return;
      }
      
      setJob(foundJob);
    } catch (error) {
      console.error("Error loading job:", error);
      toast.error("Failed to load deployment details");
    } finally {
      setLoading(false);
    }
  };

  const refreshJob = async () => {
    if (!job) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`/api/jobs/${job.brokerJobId}/refresh`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh job');
      }

      toast.success("Job status updated");
      loadJob();
    } catch (error) {
      console.error("Error refreshing job:", error);
      toast.error("Failed to refresh job status");
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'running':
      case 'executing':
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'queued':
      case 'awaiting_payment':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'running':
      case 'executing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'queued':
      case 'awaiting_payment':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Job not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/deployments')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Jobs
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshJob}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Status
        </Button>
      </div>

      {/* Status Card */}
      <Card className={`border-2 ${getStatusColor(job.status)}`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {getStatusIcon(job.status)}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-zinc-900">
                  Deployment Details
                </h1>
                <Badge className="text-sm" variant={job.status.toLowerCase() === 'completed' ? 'default' : 'secondary'}>
                  {job.status}
                </Badge>
                <Badge variant="outline" className="text-sm font-mono">
                  {job.kind}
                </Badge>
              </div>
              <p className="text-sm text-zinc-600 font-mono break-all">
                {job.brokerJobId}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-zinc-900">
              {new Date(job.createdAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {job.provider && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-600 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-zinc-900">
                {job.provider}
              </p>
            </CardContent>
          </Card>
        )}

        {job.executionTimeMs !== null && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Execution Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-zinc-900">
                {(job.executionTimeMs / 1000).toFixed(2)}s
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Compute Job Results */}
      {job.kind === 'run' && (() => {
        // Try to get output from multiple sources, checking rawResult first
        const rawResult = job.rawResult as any;
        
        // Parse output - handle both formats and convert \n to actual line breaks
        let output = job.stdout || 
                    rawResult?.result?.output || 
                    rawResult?.result?.stdout || 
                    null;
        
        // If output is a string with literal \n, it will render correctly with whitespace-pre-wrap
        // No need to replace \n since pre tag handles it
        
        const error = job.stderr || 
                     rawResult?.result?.stderr || 
                     null;
        
        const exitCode = job.exitCode ?? 
                        rawResult?.result?.exitCode ?? 
                        null;
        
        return (
        <div className="space-y-4">
          {/* Execution Summary */}
          <Card className="border-zinc-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Execution Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-600 mb-1">Exit Code</p>
                  <Badge
                    variant={exitCode === 0 ? 'default' : exitCode !== null ? 'destructive' : 'secondary'}
                    className="text-base px-3 py-1"
                  >
                    {exitCode !== null ? exitCode : 'Pending'}
                  </Badge>
                </div>
                {job.executionTimeMs !== null && (
                  <div>
                    <p className="text-sm text-zinc-600 mb-1">Execution Time</p>
                    <p className="text-lg font-semibold text-zinc-900">
                      {(job.executionTimeMs / 1000).toFixed(3)}s
                    </p>
                  </div>
                )}
              </div>
              {exitCode === 0 ? (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Process completed successfully
                </p>
              ) : exitCode !== null ? (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Process exited with error code {exitCode}
                </p>
              ) : (
                <p className="text-sm text-zinc-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Process is still running or pending
                </p>
              )}
            </CardContent>
          </Card>

          {/* Console Output */}
          <Card className="border-zinc-800 bg-zinc-950 shadow-2xl shadow-blue-500/10">
            <CardHeader className="bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800">
              <CardTitle className="flex items-center gap-3 text-zinc-100">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Terminal className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-base font-semibold">Console Output</div>
                  <div className="text-xs text-zinc-500 font-normal mt-0.5">Interactive execution logs</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {output ? (() => {
                const sections = parseConsoleOutput(output);
                return (
                  <div className="bg-zinc-950">
                    {sections.map((section, index) => (
                      <div key={index} className="border-b border-zinc-800/50 last:border-b-0">
                        {/* Section Header - Collapsible */}
                        <button
                          onClick={() => toggleSection(index)}
                          className="w-full bg-zinc-900/50 px-4 py-3 border-b border-zinc-800/50 backdrop-blur-sm hover:bg-zinc-900/70 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-sm font-mono text-zinc-300 text-left">{section.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500">{section.lines.length} lines</span>
                                {expandedSections.has(index) ? (
                                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                        
                        {/* Section Content - Collapsible */}
                        {expandedSections.has(index) && (
                          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {section.lines.map((line, lineIndex) => (
                              <ConsoleLineComponent key={lineIndex} line={line} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })() : (
                <div className="p-12 text-center">
                  <div className="inline-flex p-4 bg-zinc-900/50 rounded-full mb-4">
                    <Terminal className="h-12 w-12 text-zinc-600" />
                  </div>
                  <p className="text-sm text-zinc-400 font-medium">No output available</p>
                  <p className="text-xs text-zinc-600 mt-2">The process may still be running or produced no output</p>
                </div>
              )}

              {/* Standard Error */}
              {error && (
                <div className="relative border-t border-zinc-800">
                  {/* Terminal Header Bar */}
                  <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-xs font-mono text-zinc-500">stderr</span>
                      </div>
                      <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    </div>
                  </div>
                  {/* Scrollable Console Content */}
                  <div className="bg-zinc-950 p-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <pre className="text-red-400 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {error}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        );
      })()}

      {/* Storage Job Results */}
      {job.kind === 'store' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Storage Details
              </CardTitle>
              <CardDescription>
                Permanent storage information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.txId && (
                <div>
                  <p className="text-sm font-medium text-zinc-700 mb-1">Content ID (CID)</p>
                  <code className="block bg-zinc-100 text-zinc-900 p-3 rounded font-mono text-sm break-all">
                    {job.txId}
                  </code>
                </div>
              )}

              {job.url && (
                <div>
                  <p className="text-sm font-medium text-zinc-700 mb-2">Access URL</p>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {job.url}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {job.size !== null && (
                <div>
                  <p className="text-sm font-medium text-zinc-700 mb-1">File Size</p>
                  <p className="text-lg font-semibold text-zinc-900">
                    {(job.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Raw Result (Debug) */}
      {job.rawResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-600">
              Raw Response (Debug)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-zinc-100 text-zinc-900 p-4 rounded text-xs overflow-x-auto">
              {JSON.stringify(job.rawResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
