export async function readFile(filePath: string): Promise<string> {
  const api = (window as any).api;
  if (api && typeof api.readFile === 'function') {
    return await api.readFile(filePath);
  }

  // Fallback: try ipcRenderer if available (older setups)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ipcRenderer } = require('electron');
    return await ipcRenderer.invoke('file:read', filePath);
  } catch (err) {
    throw new Error('IPC not available in renderer');
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const api = (window as any).api;
  if (api && typeof api.writeFile === 'function') {
    await api.writeFile(filePath, content);
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ipcRenderer } = require('electron');
    await ipcRenderer.invoke('file:write', filePath, content);
    return;
  } catch (err) {
    throw new Error('IPC not available in renderer');
  }
}
