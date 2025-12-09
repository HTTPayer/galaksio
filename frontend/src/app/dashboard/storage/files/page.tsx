'use client';

import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  FileText, 
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Calendar,
  HardDrive
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StoredFile {
  id: string;
  brokerJobId: string;
  status: string;
  txId: string | null;
  url: string | null;
  provider: string | null;
  size: number | null;
  createdAt: string;
}

export default function StoredFilesPage() {
  const { data: session, status } = useSession();
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('github');
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      loadStoredFiles();
    }
  }, [session]);

  const loadStoredFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await fetch('/api/jobs?kind=store');
      if (!response.ok) throw new Error('Failed to load files');
      const files = await response.json();
      setStoredFiles(files);
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load stored files");
    } finally {
      setLoadingFiles(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full bg-white">
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
            All Stored Files
          </h1>
          <p className="mt-2 text-zinc-600">
            View and manage all your permanently stored files on Arweave
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-600">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">{storedFiles.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-600">Total Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">
                {formatBytes(storedFiles.reduce((acc, file) => acc + (file.size || 0), 0))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-600">Successful Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {storedFiles.filter(f => f.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stored Files</CardTitle>
            <CardDescription>All files stored on permanent Arweave storage</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFiles ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-950" />
              </div>
            ) : storedFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                <p className="text-zinc-600 mb-2">No stored files yet</p>
                <p className="text-sm text-zinc-500">
                  Upload your first file to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {storedFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="border border-zinc-200 rounded-lg p-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="h-5 w-5 text-blue-950 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={file.status === 'completed' ? 'default' : 'secondary'}
                              className={file.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {file.status === 'completed' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Stored
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {file.status}
                                </>
                              )}
                            </Badge>
                            {file.provider && (
                              <Badge variant="outline" className="text-xs">
                                {file.provider}
                              </Badge>
                            )}
                          </div>
                          
                          {file.txId && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-zinc-500 font-medium">Transaction ID:</span>
                                <code className="text-xs font-mono text-zinc-700 break-all">
                                  {file.txId}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(file.txId!)}
                                  className="text-blue-950 hover:text-blue-800 flex-shrink-0"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </div>
                              {file.url && (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-blue-950 hover:text-blue-800"
                                >
                                  View on Arweave
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(file.createdAt)}
                            </div>
                            {file.size && (
                              <div className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {formatBytes(file.size)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
