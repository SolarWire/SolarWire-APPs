const API_BASE = '/api/files';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface FileNodeDTO {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNodeDTO[];
  modifiedTime?: number;
}

export interface SnippetDTO {
  id: string;
  name: string;
  sourceFile: string;
  code: string;
  type: 'file' | 'snippet';
  snippetIndex?: number;
}

export const apiClient = {
  getFileTree(path?: string): Promise<FileNodeDTO[]> {
    const qs = path ? `?path=${encodeURIComponent(path)}` : '';
    return apiFetch<FileNodeDTO[]>(`/tree${qs}`);
  },

  readFile(path: string): Promise<{ content: string }> {
    return apiFetch<{ content: string }>(`/read?path=${encodeURIComponent(path)}`);
  },

  writeFile(path: string, content: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/write', {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    });
  },

  mkdir(path: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/mkdir', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  },

  delete(path: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
  },

  rename(oldPath: string, newPath: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/rename', {
      method: 'POST',
      body: JSON.stringify({ oldPath, newPath }),
    });
  },

  exists(path: string): Promise<{ exists: boolean }> {
    return apiFetch<{ exists: boolean }>(`/exists?path=${encodeURIComponent(path)}`);
  },

  getWorkspaceInfo(): Promise<{ root: string; name: string }> {
    return apiFetch<{ root: string; name: string }>('/info');
  },

  getSnippets(path?: string): Promise<SnippetDTO[]> {
    const qs = path ? `?path=${encodeURIComponent(path)}` : '';
    return apiFetch<SnippetDTO[]>(`/snippets${qs}`);
  },

  async uploadFile(file: File, dir: string): Promise<{ success: boolean; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dir', dir);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  getDownloadUrl(path: string): string {
    return `${API_BASE}/download?path=${encodeURIComponent(path)}`;
  },

  readFileAsBase64(path: string): Promise<string> {
    return apiFetch<{ content: string }>(`/read?path=${encodeURIComponent(path)}`).then(r => r.content);
  },
};