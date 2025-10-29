export type FileType = 'folder' | 'file';

export interface FileSystemNode {
  name: string;
  type: FileType;
  children?: FileSystemNode[];
  content?: string; // for files
  modified?: string; // for display
  childrenLoaded?: boolean;
}

// FIX: Add missing SearchResultNode interface.
// This type is used for search results, extending a standard node
// with the path to its parent directory.
export interface SearchResultNode extends FileSystemNode {
  path: string[];
}
