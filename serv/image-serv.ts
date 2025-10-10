// To run this server, you will need Node.js installed.
// Execute the following command in your terminal:
// node serv/image-serv.js
// Note: If you have a TypeScript runner like ts-node, you can use:
// ts-node serv/image-serv.ts
// For this environment, we will assume it's compiled to JS and run.

import * as http from 'http';
import * as url from 'url';

const PORT = process.env.IMAGE_SERVER_PORT || 8081;

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

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Access-Control-Allow-Origin', '*'); // For development

  const parsedUrl = url.parse(req.url ?? '', true);
  const pathParts = (parsedUrl.pathname ?? '').split('/').filter(p => p);

  if (pathParts.length === 0) {
    res.writeHead(404);
    res.end();
    return;
  }

  let svgResponse = ICONS.DEFAULT;

  try {
    const [endpoint, ...params] = pathParts;
    switch (endpoint) {
      // Endpoint: /name/:name (with failover)
      case 'name': {
        const name = decodeURIComponent(params[0] || '').toLowerCase();
        if (ICONS.UI[name as keyof typeof ICONS.UI]) {
          svgResponse = ICONS.UI[name as keyof typeof ICONS.UI];
        } else if (ICONS.LOGO[name as keyof typeof ICONS.LOGO]) {
          svgResponse = ICONS.LOGO[name as keyof typeof ICONS.LOGO];
        }
        break;
      }
      // Endpoint: /ext/:extension
      case 'ext': {
        const ext = decodeURIComponent(params[0] || '').toLowerCase();
        if (ICONS.EXT[ext as keyof typeof ICONS.EXT]) {
          svgResponse = ICONS.EXT[ext as keyof typeof ICONS.EXT];
        } else {
          svgResponse = generateSvg(ext, '#757575');
        }
        break;
      }
      // Endpoint: /path/:folder/:file
      case 'path': {
        const folder = decodeURIComponent(params[0] || '').toLowerCase();
        const file = decodeURIComponent(params[1] || '').toLowerCase();
        if (folder === 'ext' && ICONS.EXT[file as keyof typeof ICONS.EXT]) {
             svgResponse = ICONS.EXT[file as keyof typeof ICONS.EXT];
        } else if (folder === 'logo' && ICONS.LOGO[file as keyof typeof ICONS.LOGO]) {
            svgResponse = ICONS.LOGO[file as keyof typeof ICONS.LOGO];
        }
        break;
      }
    }
  } catch (e) {
    console.error('Error processing request:', e);
    // Fallback to default
  }
  
  res.writeHead(200);
  res.end(svgResponse);
});

server.listen(PORT, () => {
  console.log(`Image server listening on http://localhost:${PORT}`);
});