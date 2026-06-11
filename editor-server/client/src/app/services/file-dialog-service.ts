export interface OpenFileDialogOptions {
  properties?: ('openFile' | 'openDirectory' | 'multiSelections')[];
  filters?: Array<{ name: string; extensions: string[] }>;
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
}

export interface SaveFileDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  buttonLabel?: string;
}

export interface IFileDialogService {
  openFileDialog(options: OpenFileDialogOptions): Promise<string[] | null>;
  saveFileDialog?(options: SaveFileDialogOptions): Promise<string | null>;
}

export class WebFileDialogService implements IFileDialogService {
  async openFileDialog(options: OpenFileDialogOptions): Promise<string[] | null> {
    const api = window.api;
    if (api?.openFileDialog) {
      return api.openFileDialog(options);
    }
    return null;
  }

  async saveFileDialog(_options: SaveFileDialogOptions): Promise<string | null> {
    return null;
  }
}

export const fileDialogService = new WebFileDialogService();