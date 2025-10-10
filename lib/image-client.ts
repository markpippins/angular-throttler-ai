const IMAGE_SERVER_BASE_URL = 'http://localhost:8081';
   
/**
 * Gets the image URL for a file extension.
 * @param extension The file extension (e.g., 'txt', 'png').
 * @returns The full URL to the image resource.
 */
export function getImageUrlByExtension(extension: string): string {
  return `${IMAGE_SERVER_BASE_URL}/ext/${encodeURIComponent(extension)}`;
}

/**
 * Gets the image URL for a named item (e.g., 'folder', 'Angular').
 * The server handles failover logic for these names.
 * @param name The name of the item.
 * @returns The full URL to the image resource.
 */
export function getImageUrlByName(name: string): string {
  return `${IMAGE_SERVER_BASE_URL}/name/${encodeURIComponent(name)}`;
}

/**
 * Gets the image URL for a specific path on the image server.
 * @param folder The folder on the image server (e.g., 'ext', 'logo').
 * @param file The file name in that folder.
 * @returns The full URL to the image resource.
 */
export function getImageUrlByPath(folder: string, file: string): string {
  return `${IMAGE_SERVER_BASE_URL}/path/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
}
