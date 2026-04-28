import {
  isPresetLibrary,
  makeUncategorizedKey,
  makeNodeId,
  parseNodeId,
  generateInternalId,
  generatePrefixedId,
  PRESET_ID_PREFIX,
  UNCATEGORIZED_NODE_ID
} from '../utils/component-utils';

export {
  isPresetLibrary,
  makeUncategorizedKey,
  makeNodeId,
  parseNodeId,
  generateInternalId,
  generatePrefixedId,
  PRESET_ID_PREFIX,
  UNCATEGORIZED_NODE_ID
};

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
}

export interface Component {
  id: string;
  internalId: string;
  name: string;
  description?: string;
  categoryId?: string;
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
