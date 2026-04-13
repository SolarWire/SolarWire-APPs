export class HistoryManager {
  private history: string[];
  private currentIndex: number;
  private readonly maxEntries: number;

  constructor(maxEntries: number = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxEntries = maxEntries;
  }

  push(content: string): { history: string[]; index: number } {
    const newHistory = this.history.slice(0, this.currentIndex + 1);
    newHistory.push(content);

    if (newHistory.length > this.maxEntries) {
      newHistory.shift();
    }

    return {
      history: newHistory,
      index: newHistory.length - 1
    };
  }

  undo(): { content: string | null; index: number } {
    if (this.currentIndex < 0) {
      return { content: null, index: this.currentIndex };
    }

    const previousContent = this.history[this.currentIndex];
    return {
      content: previousContent,
      index: this.currentIndex - 1
    };
  }

  redo(): { content: string | null; index: number } {
    if (this.currentIndex >= this.history.length - 1) {
      return { content: null, index: this.currentIndex };
    }

    const nextContent = this.history[this.currentIndex + 1];
    return {
      content: nextContent,
      index: this.currentIndex + 1
    };
  }

  getState() {
    return {
      history: [...this.history],
      currentIndex: this.currentIndex,
      canUndo: this.currentIndex >= 0,
      canRedo: this.currentIndex < this.history.length - 1
    };
  }

  reset() {
    this.history = [];
    this.currentIndex = -1;
  }
}
