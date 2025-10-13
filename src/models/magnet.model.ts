export interface Magnet {
  _id: string; // Convex documents have an _id field.
  _creationTime: number; // Convex documents have a _creationTime field.
  folderName: string;
  displayName: string;
  tags: string; // comma-delimited string
}
