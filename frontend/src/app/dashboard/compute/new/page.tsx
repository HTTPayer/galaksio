"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  Code,
  History,
  Eye,
} from "lucide-react";
import { broker } from "@/lib/broker";
import type {
  Language,
  GPUType,
} from "@/types/compute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import GitHubImport from "@/components/GitHubImport";
import { useWallet } from "@/contexts/WalletContext";

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
];

const GPU_OPTIONS: { value: GPUType; label: string }[] = [
  { value: "l40s", label: "L40S (Default)" },
  { value: "a100", label: "A100 (High Performance)" },
];

const pythonExample = `# Example Python code
print("Hello from Galaksio Compute!")`;

const jsExample = `// Example JavaScript code
console.log("Hello from Galaksio Compute!");`;

const EXAMPLE_CODE: Partial<Record<Language, string>> = {
  python: pythonExample,
  javascript: jsExample,
};

interface JobRecord {
  id: string;
  brokerJobId: string;
  status: string;
  stdout: string | null;
  stderr: string | null;
  executionTimeMs: number | null;
  createdAt: string;
}

export default function ComputePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { walletAddress } = useWallet();
  const [code, setCode] = useState<string>(EXAMPLE_CODE.python || '');
  const [language, setLanguage] = useState<Language>("python");
  const [gpuType, setGpuType] = useState<GPUType>("l40s");
  const [timeout, setTimeout] = useState<number>(300);
  const [onDemand, setOnDemand] = useState<boolean>(false);
  
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    jobId: string;
    status: string;
    savedJobId?: string;
    result: {
      stdout: string;
      stderr: string;
      exitCode: number;
      executionTime: number;
    };
  } | null>(null);
  
  const [recentJobs, setRecentJobs] = useState<JobRecord[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("github");
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      loadRecentJobs();
    }
  }, [session]);

  const loadRecentJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await fetch('/api/jobs?kind=run');
      if (!response.ok) throw new Error('Failed to load jobs');
      const jobs = await response.json();
      setRecentJobs(jobs);
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast.error("Failed to load recent jobs");
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setCode(EXAMPLE_CODE[newLanguage] || '// Enter your code here...');
  };

  const handleGitHubImport = (importedCode: string, importedLanguage: Language, fileName: string) => {
    setCode(importedCode);
    setLanguage(importedLanguage);
    toast.success(`Loaded ${fileName}`);
  };

  const handleExecute = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code to execute");
      return;
    }

    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setExecuting(true);
    setExecutionResult(null);

    try {
      // Call broker helper - handles X402 payment flow automatically
      const brokerResult = await broker.run({
        code,
        language,
        gpu_type: gpuType,
        gpu_count: 1,
        timeout,
        on_demand: onDemand,
      });

      // Save to internal API
      const saveResponse = await fetch('/api/jobs/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brokerResult),
      });

      let savedJobId: string | undefined;
      if (saveResponse.ok) {
        const savedJob = await saveResponse.json();
        savedJobId = savedJob.id;
      } else {
        console.error('Failed to save job to database');
      }
      
      setExecutionResult({ ...brokerResult, savedJobId });
      
      if (brokerResult.result.stdout) {
        toast.success("Code executed successfully!");
      } else if (brokerResult.result.stderr) {
        toast.error("Code execution completed with errors");
      }
      
      // Reload recent jobs
      loadRecentJobs();
    } catch (error) {
      console.error("Execution error:", error);
      toast.error(error instanceof Error ? error.message : "Execution failed");
    } finally {
      setExecuting(false);
    }
  };

  const getStateColor = (status: string): string => {
    switch (status) {
      case "completed": return "text-green-600";
      case "failed": return "text-red-600";
      case "running": return "text-blue-600";
      case "pending": return "text-yellow-600";
      default: return "text-zinc-600";
    }
  };

  const getStateIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "failed": return <XCircle className="h-4 w-4" />;
      case "running": return <Loader2 className="h-4 w-4 animate-spin" />;
      case "pending": return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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

  return (
    <div className="bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            Code Execution
          </h1>
          <p className="mt-2 text-zinc-600">
            Run your code on powerful cloud infrastructure
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* GitHub Import */}
            {session.accessToken && (
              <GitHubImport
                accessToken={session.accessToken}
                onImport={handleGitHubImport}
              />
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Code Editor</CardTitle>
                <CardDescription>Write or paste your code below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={(value) => handleLanguageChange(value as Language)}>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-zinc-200">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            {lang.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Textarea
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your code here..."
                    rows={16}
                    className="font-mono text-sm"
                    disabled={executing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gpu">GPU Type</Label>
                    <Select value={gpuType} onValueChange={(value) => setGpuType(value as GPUType)} disabled={executing}>
                      <SelectTrigger id="gpu">
                        <SelectValue placeholder="Select GPU" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-zinc-200">
                        {GPU_OPTIONS.map((gpu) => (
                          <SelectItem key={gpu.value} value={gpu.value}>
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4" />
                              {gpu.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input id="timeout" type="number" value={timeout} onChange={(e) => setTimeout(parseInt(e.target.value) || 300)} min={60} max={3600} disabled={executing} />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Label htmlFor="on-demand">Execution Mode</Label>
                  <div className="flex items-center gap-2">
                    <input id="on-demand" type="checkbox" checked={onDemand} onChange={(e) => setOnDemand(e.target.checked)} disabled={executing} className="h-4 w-4" />
                    <label htmlFor="on-demand" className="text-sm">On-Demand (faster, higher cost)</label>
                  </div>
                </div>

                <Button 
                  onClick={handleExecute} 
                  disabled={executing || !code.trim() || !walletAddress} 
                  className="w-full bg-blue-950 hover:bg-blue-900 text-stone-50"
                >
                  {executing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Execute Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {executionResult && (
              <Card className={executionResult.result.stderr ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {executionResult.result.stderr ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <CardTitle className={executionResult.result.stderr ? "text-red-900" : "text-green-900"}>
                        Execution Result
                      </CardTitle>
                    </div>
                    {executionResult.result.executionTime && (
                      <Badge variant="outline">{(executionResult.result.executionTime / 1000).toFixed(2)}s</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {executionResult.jobId && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium">Job ID</Label>
                      <code className="block mt-1 text-xs text-zinc-700 font-mono">
                        {executionResult.jobId}
                      </code>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {executionResult.result.stdout && (
                      <div>
                        <Label className="text-sm font-medium">Output (stdout)</Label>
                        <pre className="mt-1 rounded bg-zinc-900 text-zinc-100 p-4 text-sm overflow-x-auto">
                          {executionResult.result.stdout}
                        </pre>
                      </div>
                    )}
                    {executionResult.result.stderr && (
                      <div>
                        <Label className="text-sm font-medium">Error (stderr)</Label>
                        <pre className="mt-1 rounded bg-zinc-900 text-red-400 p-4 text-sm overflow-x-auto">
                          {executionResult.result.stderr}
                        </pre>
                      </div>
                    )}
                    {executionResult.result.exitCode !== undefined && (
                      <div>
                        <Label className="text-sm font-medium">Exit Code</Label>
                        <Badge variant={executionResult.result.exitCode === 0 ? "outline" : "destructive"}>
                          {executionResult.result.exitCode}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {executionResult.savedJobId && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => router.push(`/dashboard/deployments/${executionResult.savedJobId}`)}
                        className="w-full bg-blue-950 hover:bg-blue-900 text-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Deployment Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <CardTitle>Recent Jobs</CardTitle>
                  </div>
                  <Button size="sm" variant="ghost" onClick={loadRecentJobs} disabled={loadingJobs}>
                    {loadingJobs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : recentJobs.length === 0 ? (
                  <p className="text-center py-8 text-zinc-500 text-sm">No recent jobs</p>
                ) : (
                  <div className="space-y-3">
                    {recentJobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="rounded-lg border border-zinc-200 p-3 space-y-2 hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-2 ${getStateColor(job.status)}`}>
                            {getStateIcon(job.status)}
                            <span className="font-medium capitalize text-sm">{job.status}</span>
                          </div>
                          {job.executionTimeMs && (
                            <Badge variant="outline" className="text-xs">
                              {(job.executionTimeMs / 1000).toFixed(2)}s
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="text-zinc-600">
                            ID: <code className="text-xs">{job.brokerJobId.substring(0, 16)}...</code>
                          </p>
                          <p className="text-zinc-500">
                            {new Date(job.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/deployments/${job.id}`)}
                          className="w-full text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
