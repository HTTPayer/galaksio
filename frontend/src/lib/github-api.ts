/**
 * GitHub API Client
 * Uses next-auth GitHub OAuth token to access user's repos
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  updated_at: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  download_url: string | null;
}

export interface GitHubFileContent {
  name: string;
  path: string;
  content: string; // base64 encoded
  encoding: string;
  sha: string;
  size: number;
}

/**
 * List user's GitHub repositories
 * Filters repos that contain Python or JavaScript files
 */
export async function listUserRepos(
  accessToken: string,
  page: number = 1,
  perPage: number = 30
): Promise<GitHubRepo[]> {
  const response = await fetch(
    `https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const repos: GitHubRepo[] = await response.json();
  
  // Filter repos with Python or JavaScript as primary language
  return repos.filter(repo => 
    repo.language === 'Python' || 
    repo.language === 'JavaScript' || 
    repo.language === 'TypeScript' ||
    repo.language === null // Include repos without detected language (might have .py or .js files)
  );
}

/**
 * Get repository tree (file structure)
 */
export async function getRepoTree(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<GitHubFile[]> {
  // Try main branch first
  let response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  // If main doesn't exist, try master
  if (response.status === 404) {
    response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch repo tree: ${response.statusText}`);
  }

  const data = await response.json();
  return data.tree || [];
}

/**
 * Get file content from GitHub
 */
export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const data: GitHubFileContent = await response.json();
  
  // Decode base64 content
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return content;
}

/**
 * Filter files by extension (.py, .js)
 */
export function filterExecutableFiles(files: GitHubFile[]): GitHubFile[] {
  return files.filter(file => {
    if (file.type !== 'file') return false;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext === 'py' || ext === 'js';
  });
}

/**
 * Check if file is Python or JavaScript
 */
export function isExecutableFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === 'py' || ext === 'js';
}

/**
 * Get language from file extension
 */
export function getLanguageFromFile(filename: string): 'python' | 'javascript' | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'py') return 'python';
  if (ext === 'js') return 'javascript';
  return null;
}

/**
 * Search for repos by name
 */
export async function searchRepos(
  accessToken: string,
  query: string,
  page: number = 1
): Promise<GitHubRepo[]> {
  const response = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+user:@me&sort=updated&per_page=30&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub search error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}
