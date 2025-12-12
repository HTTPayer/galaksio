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
  name?: string; // Optional, will be extracted from path if needed
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir' | 'blob'; // GitHub API can return 'blob'
  download_url?: string | null;
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
  console.log(`Fetching tree for ${owner}/${repo} on branch ${branch}`);
  
  // Try the specified branch first
  let response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  // If specified branch doesn't exist, try common branch names
  if (response.status === 404) {
    console.log(`Branch ${branch} not found, trying 'master'`);
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
    const errorText = await response.text();
    console.error(`Failed to fetch repo tree: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Failed to fetch repo tree: ${response.statusText}`);
  }

  const data = await response.json();
  const tree = data.tree || [];
  const truncated = data.truncated || false;
  
  console.log(`Tree retrieved: ${tree.length} items${truncated ? ' (TRUNCATED)' : ''}`);
  console.log('Sample files:', tree.slice(0, 10).map((f: GitHubFile) => `${f.path} (${f.type})`));
  
  if (truncated) {
    console.warn('Tree was truncated by GitHub API. Some files may be missing.');
  }
  
  return tree;
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
 * Filter files by extension (.py, .js, .ts, .mjs, .cjs)
 */
export function filterExecutableFiles(files: GitHubFile[]): GitHubFile[] {
  console.log(`Filtering ${files.length} total items...`);
  
  const filtered = files.filter(file => {
    // Asegurarse de que es un archivo (blob o file)
    // GitHub API usa 'blob' para archivos en el tree endpoint
    if (!file || (file.type !== 'file' && file.type !== 'blob')) {
      return false;
    }
    
    // Validar que tenga un path
    if (!file.path) return false;
    
    // Obtener el nombre del archivo desde el path
    const pathParts = file.path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    if (!fileName) return false;
    
    // Obtener la extensión
    const parts = fileName.split('.');
    if (parts.length < 2) return false; // No tiene extensión
    
    const ext = parts.pop()?.toLowerCase();
    
    // Filtrar por extensiones soportadas
    const supportedExtensions = ['py', 'js', 'ts', 'mjs', 'cjs', 'jsx', 'tsx'];
    const isSupported = ext ? supportedExtensions.includes(ext) : false;
    
    if (isSupported) {
      console.log(`✓ Found: ${file.path} (${ext})`);
    }
    
    return isSupported;
  });
  
  console.log(`Filtered to ${filtered.length} executable files`);
  return filtered;
}

/**
 * Check if file is Python or JavaScript
 */
export function isExecutableFile(filename: string): boolean {
  if (!filename) return false;
  const parts = filename.split('.');
  if (parts.length < 2) return false;
  const ext = parts.pop()?.toLowerCase();
  const supportedExtensions = ['py', 'js', 'ts', 'mjs', 'cjs', 'jsx', 'tsx'];
  return ext ? supportedExtensions.includes(ext) : false;
}

/**
 * Get language from file extension
 */
export function getLanguageFromFile(filename: string): 'python' | 'javascript' | null {
  if (!filename) return null;
  const parts = filename.split('.');
  if (parts.length < 2) return null;
  const ext = parts.pop()?.toLowerCase();
  
  // Python
  if (ext === 'py') return 'python';
  
  // JavaScript/TypeScript (todos se ejecutan como JavaScript en Node.js)
  if (ext === 'js' || ext === 'ts' || ext === 'mjs' || ext === 'cjs' || ext === 'jsx' || ext === 'tsx') {
    return 'javascript';
  }
  
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
