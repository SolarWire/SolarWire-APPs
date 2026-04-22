export interface ComponentLibraryMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentCategory {
  id: string;
  name: string;
  parentId: string | null;
  order?: number;
}

export interface Component {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  thumbnail?: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentLibrary {
  $schema: 'solarwire-component-library-v1';
  metadata: ComponentLibraryMetadata;
  categories: ComponentCategory[];
  components: Component[];
}

export interface ComponentLibraryItem {
  id: string;
  name: string;
  description?: string;
  componentCount: number;
  isPreset: boolean;
  source: 'preset' | 'indexeddb' | 'file';
}
