import { registerSolarWireLanguage } from '../../shared/utils/solarwire-language';
import { registerSolarWireCompletion } from '../../shared/utils/solarwire-completion';

export interface IMonacoService {
  registerLanguage(): void;
  getMonaco(): any;
}

export class ElectronMonacoService implements IMonacoService {
  getMonaco(): any {
    return (window as any).monaco;
  }

  registerLanguage(): void {
    const monaco = (window as any).monaco;
    if (!monaco) return;

    registerSolarWireLanguage(monaco);
    registerSolarWireCompletion(monaco);
  }
}

export const monacoService = new ElectronMonacoService();
