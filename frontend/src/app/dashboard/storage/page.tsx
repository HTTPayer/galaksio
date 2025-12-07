'use client';

import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  Upload, 
  Download, 
  Trash2, 
  File, 
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import WalletConnect from '@/components/web3/WalletConnect';

interface StoredFile {
  tx_id: string;
  filename: string;
  size: number;
  content_type: string;
  uploaded_at: string;
  gateway_url: string;
}

export default function StoragePage() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('github');
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      // TODO: Fetch user's files from backend
      loadFiles();
    }
  }, [session]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/storage/files');
      // const data = await response.json();
      // setFiles(data);
      
      // Mock data
      setFiles([]);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !walletAddress) return;

    setUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // TODO: Implement x402 payment headers with wallet
      // const response = await fetch(`${process.env.NEXT_PUBLIC_STORAGE_API_URL}/upload/file`, {
      //   method: 'POST',
      //   headers: {
      //     // Add x402 payment headers here
      //   },
      //   body: formData
      // });

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadStatus('success');
      setSelectedFile(null);
      loadFiles();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (txId: string, filename: string) => {
    try {
      // TODO: Implement with x402 payment
      // const response = await fetch(`${process.env.NEXT_PUBLIC_STORAGE_API_URL}/data/${txId}`);
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = filename;
      // a.click();
      
      console.log('Download:', txId, filename);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDelete = async (txId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      // TODO: Implement delete endpoint
      console.log('Delete:', txId);
      loadFiles();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const estimateCost = (file: File) => {
    // Base cost + Arweave cost (simplified estimation)
    const baseCost = 0.01;
    const byteCost = file.size * 0.000001; // Simplified
    return (baseCost + byteCost).toFixed(4);
  };

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

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Storage</h1>
            <p className="mt-1 text-slate-400">
              Permanent storage on Arweave • Pay with USDC via x402
            </p>
          </div>
          <WalletConnect
            onConnect={setWalletAddress}
            onDisconnect={() => setWalletAddress(undefined)}
            connectedAddress={walletAddress}
          />
        </div>

        {/* Upload Section */}
        <div className="mb-8 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Upload File</h2>
          
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">
                Select File
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                className="block w-full text-sm text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  file:cursor-pointer cursor-pointer
                  disabled:opacity-50"
              />
            </div>

            {/* File Info & Cost Estimate */}
            {selectedFile && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <File className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      ~${estimateCost(selectedFile)} USDC
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Estimated cost
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Status */}
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
                <CheckCircle className="h-4 w-4" />
                File uploaded successfully to Arweave!
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                Upload failed. Please try again.
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || !walletAddress}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload to Arweave
                </>
              )}
            </button>

            {!walletAddress && (
              <p className="text-xs text-slate-500">
                Connect your wallet to upload files
              </p>
            )}
          </div>
        </div>

        {/* Files List */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Files</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg border border-slate-800 bg-slate-900/50"
                />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-12 text-center">
              <File className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                No files yet
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Upload your first file to Arweave&apos;s permanent storage
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.tx_id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <File className="h-8 w-8 text-blue-400" />
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        {file.filename}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatFileSize(file.size)} • {file.content_type}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(file.tx_id, file.filename)}
                      className="rounded-lg border border-slate-700 p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.tx_id)}
                      className="rounded-lg border border-slate-700 p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
