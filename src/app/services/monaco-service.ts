/**
 * Monaco Editor 服务接口
 * 用于解耦组件与 Monaco Editor API 的直接依赖
 */
export interface IMonacoService {
  registerLanguage(): void;
  getMonaco(): any;
}

/**
 * Electron Monaco 服务实现
 */
export class ElectronMonacoService implements IMonacoService {
  getMonaco(): any {
    return (window as any).monaco;
  }

  registerLanguage(): void {
    const monaco = (window as any).monaco;
    if (!monaco) return;

    monaco.languages.register({ id: 'solarwire' });

    monaco.languages.setMonarchTokensProvider('solarwire', {
      tokenizer: {
        root: [
          [/#.*/, 'comment'],
          [/##.*/, 'comment'],
          [/#.*/, 'comment'],
          [/\[.*?\]/, 'keyword'],
          [/\(.*?\)/, 'keyword'],
          [/""".*?"""/, 'string'],
          [/".*?"/, 'string'],
          [/@\([^)]+\)/, 'number'],
        ],
      },
    });

    monaco.languages.setLanguageConfiguration('solarwire', {
      comments: {
        lineComment: '#',
      },
    });
  }
}

// 单例实例
export const monacoService = new ElectronMonacoService();
