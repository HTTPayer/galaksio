"use client";

import { useState, useEffect } from "react";
import { Github, Folder, FileCode, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  listUserRepos,
  getRepoTree,
  getFileContent,
  filterExecutableFiles,
  isExecutableFile,
  getLanguageFromFile,
  type GitHubRepo,
  type GitHubFile,
} from "@/lib/github-api";
import type { Language } from "@/types/compute";
import { toast } from "sonner";

interface GitHubImportProps {
  accessToken: string;
  onImport: (code: string, language: Language, fileName: string) => void;
}

export default function GitHubImport({ accessToken, onImport }: GitHubImportProps) {
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<GitHubFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(false);

  // Load repos on mount
  useEffect(() => {
    loadRepos();
  }, []);

  // Filter files when search changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFiles(
        files.filter(file => 
          file.path.toLowerCase().includes(query) || 
          (file.name?.toLowerCase().includes(query) ?? false)
        )
      );
    }
  }, [searchQuery, files]);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const repoList = await listUserRepos(accessToken);
      setRepos(repoList);
      if (repoList.length === 0) {
        toast.error("No Python or JavaScript repos found");
      }
    } catch (error) {
      console.error("Error loading repos:", error);
      toast.error("Failed to load GitHub repos");
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = async (repoFullName: string) => {
    const repo = repos.find(r => r.full_name === repoFullName);
    if (!repo) return;

    setSelectedRepo(repo);
    setSelectedFile(null);
    setSearchQuery("");
    setLoading(true);

    try {
      const [owner, name] = repo.full_name.split('/');
      console.log(`Loading files from ${owner}/${name} (branch: ${repo.default_branch})`);
      
      const tree = await getRepoTree(accessToken, owner, name, repo.default_branch);
      console.log(`Total files in tree: ${tree.length}`);
      
      const executableFiles = filterExecutableFiles(tree);
      console.log(`Executable files found: ${executableFiles.length}`, executableFiles.map(f => f.path));
      
      setFiles(executableFiles);
      setFilteredFiles(executableFiles);
      
      if (executableFiles.length === 0) {
        toast.error("No Python or JavaScript files found in this repo");
      } else {
        toast.success(`Found ${executableFiles.length} file(s)`);
      }
    } catch (error) {
      console.error("Error loading repo files:", error);
      toast.error("Failed to load repo files");
      setFiles([]);
      setFilteredFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: GitHubFile) => {
    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedRepo || !selectedFile) return;

    setImporting(true);
    try {
      const [owner, name] = selectedRepo.full_name.split('/');
      const content = await getFileContent(accessToken, owner, name, selectedFile.path);
      
      // Extract filename from path
      const fileName = selectedFile.path.split('/').pop() || 'file';
      const language = getLanguageFromFile(fileName);

      if (!language) {
        toast.error("Unsupported file type");
        return;
      }

      onImport(content, language, fileName);
      toast.success(`Imported ${fileName}`);
      
      // Reset state
      setSelectedRepo(null);
      setSelectedFile(null);
      setFiles([]);
      setFilteredFiles([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Error importing file:", error);
      toast.error("Failed to import file");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          <CardTitle>Import from GitHub</CardTitle>
        </div>
        <CardDescription>
          Select a repository and file to import
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Repository Selection */}
        <div className="space-y-2">
          <Label htmlFor="repo-select">Repository</Label>
          <Select
            value={selectedRepo?.full_name || ""}
            onValueChange={handleRepoSelect}
            disabled={loading || repos.length === 0}
          >
            <SelectTrigger id="repo-select">
              <SelectValue placeholder={
                loading ? "Loading repos..." : 
                repos.length === 0 ? "No repos found" : 
                "Select a repository"
              } />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto bg-white border-zinc-200">
              {repos.map(repo => (
                <SelectItem key={repo.id} value={repo.full_name}>
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span>{repo.name}</span>
                    {repo.language && (
                      <Badge variant="outline" className="text-xs">
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Selection */}
        {selectedRepo && (
          <div className="space-y-2">
            <Label>Files ({filteredFiles.length})</Label>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* File List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-zinc-500">
                {searchQuery ? "No files match your search" : "No executable files found"}
              </div>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {filteredFiles.map(file => (
                  <button
                    key={file.sha}
                    onClick={() => handleFileSelect(file)}
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors ${
                      selectedFile?.sha === file.sha
                        ? "bg-blue-50 text-blue-900"
                        : "hover:bg-zinc-100"
                    }`}
                  >
                    <FileCode className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{file.path}</span>
                    <Badge variant="outline" className="text-xs">
                      {file.path.split('.').pop()?.toLowerCase() || 'file'}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import Button */}
        {selectedFile && (
          <Button
            onClick={handleImport}
            disabled={importing}
            className="w-full"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileCode className="mr-2 h-4 w-4" />
                Import {selectedFile.path.split('/').pop()}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
