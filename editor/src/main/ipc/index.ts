import { registerFileHandlers } from './file-handlers';
import { registerDialogHandlers } from './dialog-handlers';
import { registerTestHandlers } from './test-handlers';

export function setupIPC(): void {
  registerFileHandlers();
  registerDialogHandlers();
  registerTestHandlers();
}
