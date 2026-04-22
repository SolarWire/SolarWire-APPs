/**
 * @deprecated Use project-based file storage instead.
 * Images are now saved directly to the project's assets/images directory.
 * This class is kept for backward compatibility only.
 */
export class ImageStorage {
  private static DB_NAME = 'SolarWireImages';
  private static STORE_NAME = 'images';
  private static VERSION = 1;

  static async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'name' });
        }
      };

      request.onsuccess = () => resolve(request.result);
    });
  }

  static async saveImage(name: string, file: File): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const reader = new FileReader();
      reader.onload = () => {
        store.put({ name, data: reader.result, type: file.type });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      reader.readAsDataURL(file);
    });
  }

  static async getImage(name: string): Promise<string | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(name);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? (result.data as string) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteImage(name: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.delete(name);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  static async listImages(): Promise<string[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
}
