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
const generateFolderSvg = (color: string = '#FBBF24') => {
  // A path that resembles a folder icon, inspired by modern UI icons.
  return `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M12,12 H28 L34,18 H52 C54.209,18 56,19.791 56,22 V48 C56,50.209 54.209,52 52,52 H12 C9.791,52 8,50.209 8,48 V16 C8,13.791 9.791,12 12,12 Z" fill="${color}"/>
    </svg>
  `;
};

const generateFileSvg = (text: string | null = null, textColor: string = '#6B7280') => {
  // A path that resembles a document with a dog-ear corner.
  const displayText = text ? (text.length > 4 ? text.substring(0, 4) : text) : '';
  const textElement = displayText
    ? `<text x="34" y="44" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${textColor}" font-weight="bold">${displayText.toUpperCase()}</text>`
    : '';

  return `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M14,8 H42 L54,20 V56 H14 Z" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="1.5"/>
      <path d="M42,8 V20 H54" fill="none" stroke="#D1D5DB" stroke-width="1.5"/>
      ${textElement}
    </svg>
  `;
};

const generateLogoSvg = (text: string, bgColor: string, textColor: string = '#FFFFFF') => {
  // A rounded square for logos or special icons.
  return `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="8" ry="8" fill="${bgColor}" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="${textColor}" font-weight="bold">
        ${text}
      </text>
    </svg>
  `;
};

const ICONS = {
  UI: {
    folder: generateFolderSvg(),
    file: generateFileSvg(),
  },
  LOGO: {
    angular: generateLogoSvg('Ng', '#DD0031'),
    'node.js': generateLogoSvg('Js', '#4CAF50'),
  },
  EXT: {
    txt: generateFileSvg('txt', '#2196F3'),
    docx: generateFileSvg('doc', '#2B579A'),
    jpg: generateFileSvg('jpg', '#E91E63'),
    png: generateFileSvg('png', '#E91E63'),
  },
  DEFAULT: generateFileSvg('?', '#607D8B'),
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
        // Since UI icons represent folder-like concepts, use a gray folder icon as a fallback.
        const svgResponse = generateFolderSvg('#A0AEC0');
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
        let svgResponse;
        if (ICONS.EXT[ext as keyof typeof ICONS.EXT]) {
          svgResponse = ICONS.EXT[ext as keyof typeof ICONS.EXT];
        } else {
          svgResponse = generateFileSvg(ext, '#757575');
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