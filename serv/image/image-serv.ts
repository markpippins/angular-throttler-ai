
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

// --- SVG Generation Helpers ---
const generateSvg = (text: string, bgColor: string, textColor: string = '#FFFFFF') => {
  return `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${bgColor}" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="${textColor}" font-weight="bold">
        ${text}
      </text>
    </svg>
  `;
};

const ICONS = {
  UI: {
    folder: generateSvg('Dir', '#FFC107'),
    file: generateSvg('File', '#9E9E9E'),
  },
  LOGO: {
    angular: generateSvg('Ng', '#DD0031'),
    'node.js': generateSvg('Js', '#4CAF50'),
  },
  EXT: {
    txt: generateSvg('txt', '#2196F3'),
    docx: generateSvg('doc', '#2B579A'),
    jpg: generateSvg('jpg', '#E91E63'),
    png: generateSvg('png', '#E91E63'),
  },
  DEFAULT: generateSvg('?', '#607D8B'),
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

    switch (endpoint) {
      case 'ui': {
        const name = decodeURIComponent(params[0] || '');
        const lowerCaseName = name.toLowerCase();
        const isAllowed = UI_ICON_NAMES.some(n => n.toLowerCase() === lowerCaseName);

        if (isAllowed) {
            // Prepend the 'ui' directory and use the lowercased name for searching
            const filePathInSubdir = path.join('ui', lowerCaseName);
            fileServed = await serveStaticFile(filePathInSubdir, res);
            if (fileServed) return;
        }

        // Fallback for graceful degradation, just like /name
        res.setHeader('Content-Type', 'image/svg+xml');
        const svgResponse = generateSvg(name.substring(0, 3), '#4A5568'); // A neutral color
        res.writeHead(200).end(svgResponse);
        return;
      }

      case 'name': {
        const name = decodeURIComponent(params[0] || '').toLowerCase();
        fileServed = await serveStaticFile(name, res);
        if (fileServed) return;

        // Fallback to SVG
        res.setHeader('Content-Type', 'image/svg+xml');
        const type = parsedUrl.query.type;
        let svgResponse;

        if (ICONS.LOGO[name as keyof typeof ICONS.LOGO]) {
          svgResponse = ICONS.LOGO[name as keyof typeof ICONS.LOGO];
        } else if (ICONS.UI[name as keyof typeof ICONS.UI]) { // Keep for explicit requests for "folder", "file"
          svgResponse = ICONS.UI[name as keyof typeof ICONS.UI];
        } else if (type === 'folder') {
          svgResponse = ICONS.UI.folder;
        } else if (type === 'file') {
          svgResponse = ICONS.UI.file;
        } else {
          svgResponse = ICONS.DEFAULT;
        }
        
        res.writeHead(200).end(svgResponse);
        return;
      }

      case 'ext': {
        const ext = decodeURIComponent(params[0] || '').toLowerCase();
        fileServed = await serveStaticFile(ext, res);
        if (fileServed) return;

        // Fallback to SVG
        res.setHeader('Content-Type', 'image/svg+xml');
        let svgResponse = ICONS.DEFAULT;
        if (ICONS.EXT[ext as keyof typeof ICONS.EXT]) {
          svgResponse = ICONS.EXT[ext as keyof typeof ICONS.EXT];
        } else {
          svgResponse = generateSvg(ext, '#757575');
        }
        res.writeHead(200).end(svgResponse);
        return;
      }
    }
  } catch (e) {
    console.error('Error processing request:', e);
    res.writeHead(500).end('Server Error');
    return;
  }
  
  // Default fallback for any other endpoint
  res.setHeader('Content-Type', 'image/svg+xml');
  res.writeHead(200).end(ICONS.DEFAULT);
});

server.listen(PORT, () => {
  console.log(`Image server listening on http://localhost:${PORT}`);
  if (IMAGE_ROOT_DIR) {
    console.log(`Serving static images from: ${IMAGE_ROOT_DIR}`);
  } else {
    console.log('IMAGE_ROOT_DIR not set. Serving only dynamic SVGs.');
  }
});
