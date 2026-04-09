import { registerFileHandlers } from './file-handlers';
import { registerDialogHandlers } from './dialog-handlers';
import { registerGitHandlers } from './git-handlers';

export function setupIPC(): void {
  registerFileHandlers();
  registerDialogHandlers();
  registerGitHandlers();
}
