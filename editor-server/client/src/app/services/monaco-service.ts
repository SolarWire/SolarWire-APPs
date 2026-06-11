import { registerSolarWireLanguage } from '../../shared/utils/solarwire-language';
import { registerSolarWireCompletion } from '../../shared/utils/solarwire-completion';

export interface IMonacoService {
  registerLanguage(): void;
  getMonaco(): any;
}

export class WebMonacoService implements IMonacoService {
  private monaco: any = null;

  getMonaco(): any {
    return this.monaco;
  }

  setMonaco(monaco: any): void {
    this.monaco = monaco;
    this.registerLanguage();
  }

  registerLanguage(): void {
    const monaco = this.monaco;
    if (!monaco) return;

    try {
      registerSolarWireLanguage(monaco);
      registerSolarWireCompletion(monaco);
    } catch (e) {
      console.warn('Failed to register SolarWire language:', e);
    }
  }
}

export const monacoService = new WebMonacoService();