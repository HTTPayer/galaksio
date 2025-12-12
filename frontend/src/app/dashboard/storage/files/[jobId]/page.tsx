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
  Database,
  AlertCircle,
  FileText,
  Download,
  Copy,
  HardDrive,
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
  txId: string | null;
  url: string | null;
  provider: string | null;
  size: number | null;
  createdAt: string;
  updatedAt: string;
  rawResult: {
    result?: {
      result?: {
        filename?: string;
        contentType?: string;
        platform?: string;
        permanent?: boolean;
        ttl?: number;
        ttlHours?: number;
        retrievalUrl?: string;
        arweaveUrl?: string;
        arweaveTxId?: string;
        dataSize?: number;
        entityKey?: string;
        txHash?: string;
        success?: boolean;
      };
    };
  } | null;
}

interface StorageData {
  data?: string; // base64 encoded data
  contentType?: string;
  [key: string]: unknown;
}

export default function StorageDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [decodedContent, setDecodedContent] = useState<string>("");
  const [contentError, setContentError] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("github");
    }
  }, [status]);

  const loadJobDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to load jobs');
      const jobs: JobRecord[] = await response.json();
      const foundJob = jobs.find(j => j.id === jobId);
      
      if (foundJob) {
        console.log("Found job:", foundJob);
        console.log("Raw result:", foundJob.rawResult);
        setJob(foundJob);
        // Automatically fetch storage data if available
        const retrievalUrl = foundJob.rawResult?.result?.result?.retrievalUrl 
          || foundJob.rawResult?.result?.result?.arweaveUrl 
          || foundJob.url;
        console.log("Retrieval URL to fetch:", retrievalUrl);
        if (retrievalUrl) {
          fetchStorageData(retrievalUrl);
        } else {
          console.warn("No retrieval URL found");
        }
      } else {
        toast.error("Job not found");
      }
    } catch (error) {
      console.error("Error loading job:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && jobId) {
      loadJobDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, jobId]);

  const fetchStorageData = async (retrievalUrl: string) => {
    setLoadingData(true);
    setContentError("");
    console.log("Fetching storage data from:", retrievalUrl);
    try {
      const response = await fetch(retrievalUrl, {
        method: 'GET',
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch storage data: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log("Content-Type:", contentType);
      
      // For Arweave, the response is the raw file content (base64 encoded)
      if (retrievalUrl.includes('arweave.net') || retrievalUrl.includes('galaksio-storage')) {
        const text = await response.text();
        console.log("Arweave/Galaksio raw content (base64):", text);
        
        // Try to decode from base64
        try {
          const decoded = atob(text);
          console.log("Decoded content:", decoded);
          setDecodedContent(decoded);
          toast.success("File content loaded successfully");
        } catch (e) {
          // If it fails, it might not be base64, use as-is
          console.warn("Not base64, using raw text:", e);
          setDecodedContent(text);
          toast.success("File content loaded successfully");
        }
      } else {
        // For other providers (like Arkiv), try JSON with base64 data field
        const data: StorageData = await response.json();
        console.log("Received data:", data);

        // Decode base64 data if present
        if (data.data) {
          try {
            const decoded = atob(data.data);
            console.log("Decoded content:", decoded);
            setDecodedContent(decoded);
            toast.success("File content loaded successfully");
          } catch (e) {
            console.error("Error decoding base64:", e);
            setContentError("Failed to decode content");
            toast.error("Failed to decode file content");
          }
        } else {
          console.warn("No 'data' field in response");
          setContentError("No data field in response");
        }
      }
    } catch (error) {
      console.error("Error fetching storage data:", error);
      setContentError(error instanceof Error ? error.message : "Failed to fetch data");
      toast.error("Failed to fetch storage data");
    } finally {
      setLoadingData(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const downloadContent = () => {
    if (!decodedContent || !job) return;
    
    const resultData = job.rawResult?.result?.result;
    const filename = resultData?.filename || `storage-${job.brokerJobId}.txt`;
    const blob = new Blob([decodedContent], { 
      type: resultData?.contentType || 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started");
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

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
      <div className="p-8 max-w-7xl mx-auto bg-white">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">Job not found</h3>
          <Button onClick={() => router.push('/dashboard/storage/files')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Files
          </Button>
        </div>
      </div>
    );
  }

  // Helper to get the actual result data (handles nested structure)
  const getResultData = () => job?.rawResult?.result?.result;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/dashboard/storage/files')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Storage File Details</h1>
            <p className="text-zinc-600 mt-2">
              {getResultData()?.filename || 'Stored file'}
            </p>
          </div>
        </div>
        <Button onClick={loadJobDetails} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getStatusIcon(job.status)}
            <span>File Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-zinc-500 mb-1">Status</p>
              <Badge variant={getStatusBadgeVariant(job.status)} className="font-medium">
                {job.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-1">Provider</p>
              <p className="font-medium text-zinc-900">{job.provider || 'Galaksio Storage'}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-1">Platform</p>
              <p className="font-medium text-zinc-900">Galaksio OS</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-1">Storage Type</p>
              <p className="font-medium text-zinc-900">
                {getResultData()?.permanent ? 'Permanent' : 'Temporary'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-zinc-500 mb-1">Filename</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm text-zinc-900">
                  {getResultData()?.filename || 'Unknown'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-1">Content Type</p>
              <p className="font-mono text-sm text-zinc-900">
                {getResultData()?.contentType || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-1">Size</p>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-zinc-500" />
                <p className="font-medium text-zinc-900">
                  {getResultData()?.dataSize ? formatBytes(getResultData()!.dataSize!) : (job.size ? formatBytes(job.size) : 'N/A')}
                </p>
              </div>
            </div>
            {getResultData()?.ttlHours && (
              <div>
                <p className="text-sm text-zinc-500 mb-1">TTL (Time to Live)</p>
                <p className="font-medium text-zinc-900">
                  {getResultData()!.ttlHours} hours
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-zinc-500 mb-1">Created At</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <p className="font-medium text-zinc-900">
                  {new Date(job.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File Content
            </CardTitle>
            {decodedContent && (
              <Button onClick={downloadContent} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
          <CardDescription>
            Decoded content from storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              <p className="ml-2 text-zinc-600">Loading content...</p>
            </div>
          ) : contentError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-900">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Error loading content</p>
              </div>
              <p className="text-sm text-red-700 mt-2">{contentError}</p>
              {(getResultData()?.retrievalUrl || getResultData()?.arweaveUrl || job.url) && (
                <Button 
                  onClick={() => fetchStorageData(getResultData()?.retrievalUrl || getResultData()?.arweaveUrl || job.url!)} 
                  variant="outline" 
                  size="sm"
                  className="mt-3"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          ) : decodedContent ? (
            <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
              <pre className="text-sm font-mono whitespace-pre-wrap wrap-break-word text-zinc-900">
                {decodedContent}
              </pre>
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-zinc-300" />
              <p>No content available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-zinc-500">Job ID</p>
                <Button 
                  onClick={() => copyToClipboard(job.brokerJobId, "Job ID")} 
                  variant="ghost" 
                  size="sm"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-mono text-sm text-zinc-900 break-all bg-zinc-50 p-2 rounded">
                {job.brokerJobId}
              </p>
            </div>

            {(getResultData()?.entityKey || getResultData()?.arweaveTxId || job.txId) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-zinc-500">
                    {getResultData()?.arweaveTxId ? 'Arweave TX ID' : 'Entity Key / CID'}
                  </p>
                  <Button 
                    onClick={() => copyToClipboard(getResultData()?.arweaveTxId || getResultData()?.entityKey || job.txId!, getResultData()?.arweaveTxId ? "Arweave TX ID" : "Entity Key")} 
                    variant="ghost" 
                    size="sm"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-mono text-sm text-zinc-900 break-all bg-zinc-50 p-2 rounded">
                  {getResultData()?.arweaveTxId || getResultData()?.entityKey || job.txId}
                </p>
              </div>
            )}

            {(getResultData()?.retrievalUrl || getResultData()?.arweaveUrl || job.url) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-zinc-500">
                    {getResultData()?.arweaveUrl ? 'Arweave URL' : 'Retrieval URL'}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => copyToClipboard(getResultData()?.arweaveUrl || getResultData()?.retrievalUrl || job.url!, "URL")} 
                      variant="ghost" 
                      size="sm"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      onClick={() => window.open(getResultData()?.arweaveUrl || getResultData()?.retrievalUrl || job.url!, '_blank')} 
                      variant="ghost" 
                      size="sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="font-mono text-xs text-zinc-900 break-all bg-zinc-50 p-2 rounded">
                  {getResultData()?.arweaveUrl || getResultData()?.retrievalUrl || job.url}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Raw Result (Debug) */}
      {job.rawResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Raw Result (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-zinc-50 p-4 rounded border border-zinc-200 overflow-x-auto">
              {JSON.stringify(job.rawResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
