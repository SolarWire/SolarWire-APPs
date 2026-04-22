/**
 * @deprecated Use project-based file storage instead.
 * Images are now saved directly to the project's assets/images directory.
 * This class is kept for backward compatibility only.
 * 
 * Image Asset Manager
 * Manages image files for SolarWire projects
 * Handles adding, retrieving, and managing image assets
 */

export interface ImageAsset {
  name: string;
  path: string;
  url: string;
  size: number;
  type: string;
  addedAt: number;
}

export interface ImageAssetManagerOptions {
  /** Base directory for assets (default: 'assets/images') */
  assetsDir?: string;
  /** Whether to use Blob URLs (default: true) */
  useBlobUrls?: boolean;
}

export class ImageAssetManager {
  private assetsDir: string;
  private useBlobUrls: boolean;
  private assets: Map<string, ImageAsset> = new Map();
  private blobUrls: Map<string, string> = new Map();

  constructor(options: ImageAssetManagerOptions = {}) {
    this.assetsDir = options.assetsDir || 'assets/images';
    this.useBlobUrls = options.useBlobUrls !== false;
  }

  /**
   * Add an image file to the project
   * @param file The image file to add
   * @returns Promise resolving to the relative path of the image
   */
  async addImage(file: File): Promise<string> {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const name = `${timestamp}_${sanitizedName}`;
    const relativePath = `${this.assetsDir}/${name}`;

    let url: string;
    if (this.useBlobUrls) {
      url = URL.createObjectURL(file);
      this.blobUrls.set(name, url);
    } else {
      url = `${this.assetsDir}/${name}`;
    }

    const asset: ImageAsset = {
      name: sanitizedName,
      path: relativePath,
      url,
      size: file.size,
      type: file.type,
      addedAt: timestamp,
    };

    this.assets.set(name, asset);
    return relativePath;
  }

  /**
   * Get the URL for a given relative path
   * @param relativePath The relative path of the image
   * @returns The URL that can be used in img/src tags
   */
  getImageUrl(relativePath: string): string {
    const name = relativePath.split('/').pop() || relativePath;
    const asset = this.assets.get(name);
    return asset?.url || relativePath;
  }

  /**
   * Check if an image exists in the manager
   * @param relativePath The relative path to check
   */
  exists(relativePath: string): boolean {
    const name = relativePath.split('/').pop() || relativePath;
    return this.assets.has(name);
  }

  /**
   * Delete an image from the manager
   * @param relativePath The relative path of the image to delete
   */
  async delete(relativePath: string): Promise<void> {
    const name = relativePath.split('/').pop() || relativePath;
    const asset = this.assets.get(name);
    if (asset) {
      if (this.blobUrls.has(name)) {
        URL.revokeObjectURL(this.blobUrls.get(name)!);
        this.blobUrls.delete(name);
      }
      this.assets.delete(name);
    }
  }

  /**
   * Get all images in the project
   * @returns Array of all image assets
   */
  getAllImages(): ImageAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get an image by its name
   * @param name The image name
   */
  getImage(name: string): ImageAsset | undefined {
    return this.assets.get(name);
  }

  /**
   * Clean up all blob URLs and assets
   */
  dispose(): void {
    for (const [name, url] of this.blobUrls) {
      URL.revokeObjectURL(url);
    }
    this.blobUrls.clear();
    this.assets.clear();
  }
}
