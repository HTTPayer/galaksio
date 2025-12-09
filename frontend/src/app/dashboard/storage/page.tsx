'use client';

import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  Upload, 
  FileText, 
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Clock,
  Infinity,
  Info
} from 'lucide-react';
import { broker } from '@/lib/broker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/WalletContext';

type StorageProvider = 'galaksio-storage' | 'spuro' | 'openx402';

export default function StoragePage() {
  const { data: session, status } = useSession();
  const { walletAddress } = useWallet();
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [textData, setTextData] = useState('');
  const [filename, setFilename] = useState('data.txt');
  
  // Storage options
  const [permanent, setPermanent] = useState<boolean>(true);
  const [ttl, setTtl] = useState<number>(86400); // 24 hours default
  const [provider, setProvider] = useState<StorageProvider | ''>('');
  
  const [uploadResult, setUploadResult] = useState<{
    jobId: string;
    status: string;
    result: {
      cid: string;
      url: string;
      provider: string;
      size: number;
    };
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('github');
    }
  }, [status]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate input
    if (uploadMode === 'file' && !selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (uploadMode === 'text' && !textData.trim()) {
      toast.error('Please enter some text to upload');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      let brokerResult;

      if (uploadMode === 'file' && selectedFile) {
        // Upload file directly - broker will convert to base64
        brokerResult = await broker.store({
          data: selectedFile,
          filename: selectedFile.name,
          options: {
            permanent,
            ttl: permanent ? undefined : ttl,
            provider: provider || undefined,
          },
        });
      } else {
        // Upload text data - broker will convert to base64
        brokerResult = await broker.store({
          data: textData,
          filename: filename,
          options: {
            permanent,
            ttl: permanent ? undefined : ttl,
            provider: provider || undefined,
          },
        });
      }
      
      setUploadResult(brokerResult);

      // Save to internal API
      const saveResponse = await fetch('/api/jobs/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brokerResult),
      });

      if (!saveResponse.ok) {
        console.error('Failed to save file record to database');
      }
      
      toast.success('File uploaded successfully!');
      
      // Reset form
      if (uploadMode === 'file') {
        setSelectedFile(null);
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setTextData('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
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

  const formatTTL = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${seconds} seconds`;
  };

  const getEstimatedSize = (): number => {
    if (uploadMode === 'file' && selectedFile) {
      return selectedFile.size;
    }
    return new Blob([textData]).size;
  };

  if (status === 'loading') {
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            Decentralized Storage
          </h1>
          <p className="mt-2 text-zinc-600">
            Store files on IPFS or Arweave with pay-per-use X402 protocol
          </p>
        </div>

        {/* Wallet Warning */}
        {!walletAddress && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-900">
                  Wallet Required
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-yellow-800">
              <p>
                Connect your wallet to upload files. Payments are processed securely via X402 protocol using USDC.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Upload Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Storage Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Storage Type</CardTitle>
                <CardDescription>
                  Choose between permanent (Arweave) or temporary (IPFS) storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPermanent(true)}
                    className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 transition-all ${
                      permanent
                        ? 'border-blue-950 bg-blue-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Infinity className={`h-5 w-5 ${permanent ? 'text-blue-950' : 'text-zinc-600'}`} />
                      <span className={`font-semibold ${permanent ? 'text-blue-950' : 'text-zinc-900'}`}>
                        Permanent
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 text-left">
                      Stored forever on Arweave blockchain. Higher cost, guaranteed availability.
                    </p>
                  </button>

                  <button
                    onClick={() => setPermanent(false)}
                    className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 transition-all ${
                      !permanent
                        ? 'border-blue-950 bg-blue-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className={`h-5 w-5 ${!permanent ? 'text-blue-950' : 'text-zinc-600'}`} />
                      <span className={`font-semibold ${!permanent ? 'text-blue-950' : 'text-zinc-900'}`}>
                        Temporary
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 text-left">
                      IPFS with TTL. Lower cost, suitable for temporary data.
                    </p>
                  </button>
                </div>

                {!permanent && (
                  <div className="space-y-2">
                    <Label htmlFor="ttl">Time to Live (TTL)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="ttl"
                        type="number"
                        value={ttl}
                        onChange={(e) => setTtl(Number(e.target.value))}
                        min={60}
                        max={2592000}
                        disabled={uploading}
                        className="flex-1"
                      />
                      <span className="text-sm text-zinc-600 min-w-[100px]">
                        {formatTTL(ttl)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      How long the file will be available (60 seconds to 30 days)
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="provider">Provider (Optional)</Label>
                  <select
                    id="provider"
                    title="Select storage provider"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as StorageProvider | '')}
                    disabled={uploading}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-950 focus:outline-none focus:ring-1 focus:ring-blue-950"
                  >
                    <option value="">Auto (Broker chooses best)</option>
                    <option value="galaksio-storage">Galaksio Storage (Arweave)</option>
                    <option value="spuro">Spuro (IPFS with TTL)</option>
                    <option value="openx402">OpenX402 (IPFS)</option>
                  </select>
                  <p className="text-xs text-zinc-500">
                    Leave as Auto to let the broker select the best available provider
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upload Method Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Method</CardTitle>
                <CardDescription>
                  Choose to upload a file from your device or create text content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Button
                    variant={uploadMode === 'file' ? 'default' : 'outline'}
                    onClick={() => {
                      setUploadMode('file');
                      setUploadResult(null);
                    }}
                    className={uploadMode === 'file' ? 'flex-1 bg-blue-950 text-stone-50 hover:bg-blue-900' : 'flex-1'}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                  <Button
                    variant={uploadMode === 'text' ? 'default' : 'outline'}
                    onClick={() => {
                      setUploadMode('text');
                      setUploadResult(null);
                    }}
                    className={uploadMode === 'text' ? 'flex-1 bg-blue-950 text-stone-50 hover:bg-blue-900' : 'flex-1'}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Create Text
                  </Button>
                </div>

                {uploadMode === 'file' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file-input">Select File</Label>
                      <label
                        htmlFor="file-input"
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                          uploading
                            ? 'border-zinc-300 bg-zinc-50 cursor-not-allowed'
                            : selectedFile
                            ? 'border-blue-950 bg-blue-50 hover:bg-blue-100'
                            : 'border-zinc-300 bg-zinc-50 hover:border-blue-950 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-2 py-6">
                          {selectedFile ? (
                            <>
                              <CheckCircle className="h-8 w-8 text-blue-950" />
                              <div className="text-center">
                                <p className="text-sm font-semibold text-blue-950">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-blue-800 mt-1">
                                  {formatBytes(selectedFile.size)}
                                </p>
                              </div>
                              <p className="text-xs text-blue-700 mt-2">
                                Click to change file
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-zinc-400" />
                              <div className="text-center">
                                <p className="text-sm font-semibold text-zinc-900">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">
                                  Any file type supported
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        <Input
                          id="file-input"
                          type="file"
                          onChange={handleFileSelect}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="filename">Filename</Label>
                      <Input
                        id="filename"
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="data.txt"
                        disabled={uploading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="text-data">Content</Label>
                      <Textarea
                        id="text-data"
                        value={textData}
                        onChange={(e) => setTextData(e.target.value)}
                        placeholder="Enter text content to store..."
                        rows={10}
                        disabled={uploading}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-zinc-500">
                        Size: {formatBytes(new Blob([textData]).size)}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={
                    uploading ||
                    !walletAddress ||
                    (uploadMode === 'file' && !selectedFile) ||
                    (uploadMode === 'text' && !textData.trim())
                  }
                  className="w-full bg-blue-950 text-stone-50 hover:bg-blue-900"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Payment & Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload & Pay
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info & Results */}
          <div className="space-y-6">
            {/* Upload Info */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-blue-900">
                    How It Works
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-blue-900">
                <div className="space-y-1">
                  <p className="font-semibold">1. Configure Storage</p>
                  <p className="text-blue-800">
                    Choose permanent (Arweave) or temporary (IPFS) storage
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">2. Upload Content</p>
                  <p className="text-blue-800">
                    Select a file or paste text content
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">3. Automatic Payment</p>
                  <p className="text-blue-800">
                    X402 protocol handles payment via your wallet
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">4. Get Your Link</p>
                  <p className="text-blue-800">
                    Receive a permanent CID and access URL
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Cost */}
            {(selectedFile || textData) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estimated Cost</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">File Size</span>
                    <span className="font-mono text-sm font-semibold text-zinc-900">
                      {formatBytes(getEstimatedSize())}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">Storage Type</span>
                    <Badge variant="outline" className="border-blue-950 text-blue-950">
                      {permanent ? 'Permanent' : `Temporary (${formatTTL(ttl)})`}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">Provider</span>
                    <span className="text-sm font-medium text-zinc-900">
                      {provider || 'Auto'}
                    </span>
                  </div>
                  <div className="border-t border-zinc-200 pt-3">
                    <p className="text-xs text-zinc-500">
                      Final cost determined by broker and paid via X402
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-900">
                      Upload Successful
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-green-800">Content ID (CID)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 rounded bg-green-100 px-3 py-2 text-xs text-green-900 break-all font-mono">
                          {uploadResult.result.cid}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(uploadResult.result.cid)}
                          className="shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-green-800 text-xs">Status</Label>
                        <Badge variant="outline" className="mt-1 border-green-600 text-green-700">
                          {uploadResult.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-green-800 text-xs">Size</Label>
                        <p className="mt-1 text-sm font-medium text-green-900">
                          {formatBytes(uploadResult.result.size)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-green-800 text-xs">Provider</Label>
                        <p className="mt-1 text-sm font-medium text-green-900">
                          {uploadResult.result.provider}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <a
                        href={uploadResult.result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                      >
                        View File
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
