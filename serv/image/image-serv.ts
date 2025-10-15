// To run this server, you will need Node.js installed.
// Execute the following command in your terminal:
// node serv/image-serv.js
// Note: If you have a TypeScript runner like ts-node, you can use:
// ts-node serv/image-serv.ts
// For this environment, we will assume it's compiled to JS and run.

import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.IMAGE_SERVER_PORT || 8081;
const IMAGE_ROOT_DIR = process.env.IMAGE_ROOT_DIR;
const PREFERRED_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.gif'];
const UI_ICON_NAMES = ['Users', 'Home', 'Desktop', 'Documents', 'resources'];

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

// --- Server Logic ---

// Helper to serve a static file if it exists
const serveStaticFile = async (baseName: string, res: http.ServerResponse): Promise<boolean> => {
  if (!IMAGE_ROOT_DIR) return false;

  for (const ext of PREFERRED_EXTENSIONS) {
    try {
      const fileName = `${baseName}${ext}`;
      const filePath = path.join(IMAGE_ROOT_DIR, fileName);
      
      await fs.access(filePath); // Check for existence

      const fileContent = await fs.readFile(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fileContent);
      return true; // File found and served

    } catch (error) {
      // File with this extension doesn't exist, try next extension
    }
  }
  return false; // No matching file found
};


const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] Request: ${req.method} ${req.url}`);
  res.setHeader('Access-Control-Allow-Origin', '*');

  const parsedUrl = url.parse(req.url ?? '', true);
  const pathParts = (parsedUrl.pathname ?? '').split('/').filter(p => p);

  if (pathParts.length === 0) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  try {
    const [endpoint, ...params] = pathParts;
    let fileServed = false;

    if (endpoint === 'ui') {
      const name = decodeURIComponent(params[0] || '');
      const lowerCaseName = name.toLowerCase();
      const isAllowed = UI_ICON_NAMES.some(n => n.toLowerCase() === lowerCaseName);

      if (isAllowed) {
        // Prepend the 'ui' directory and use the lowercased name for searching
        const filePathInSubdir = path.join('ui', lowerCaseName);
        fileServed = await serveStaticFile(filePathInSubdir, res);
      }
    } else if (endpoint === 'name') {
      const name = decodeURIComponent(params[0] || '').toLowerCase();
      fileServed = await serveStaticFile(name, res);
    } else if (endpoint === 'ext') {
      const ext = decodeURIComponent(params[0] || '').toLowerCase();
      fileServed = await serveStaticFile(ext, res);
    }

    if (!fileServed) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } catch (e) {
    console.error('Error processing request:', e);
    res.writeHead(500).end('Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Image server listening on http://localhost:${PORT}`);
  if (IMAGE_ROOT_DIR) {
    console.log(`Serving static images from: ${IMAGE_ROOT_DIR}`);
  } else {
    console.log('IMAGE_ROOT_DIR not set. No images will be served.');
  }
});
