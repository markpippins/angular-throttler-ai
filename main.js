const { app, BrowserWindow, ipcMain, protocol, session, net } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { pathToFileURL } = require('url');

// This must be called before the app is ready.
// Registering a custom protocol is a security best practice for Electron apps.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } }
]);


const rootPath = os.homedir();

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the app from a more standard-looking custom protocol URL.
  win.loadURL('app://localhost');

  // Open DevTools for debugging.
  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  // Add CSP header for security. This is applied to all responses.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' app:; script-src 'self' app: https://cdn.tailwindcss.com https://cdn.jsdelivr.net/npm/ https://esm.sh/ https://next.esm.sh/; style-src 'self' app: 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' app: data: https://picsum.photos http://localhost:8081; connect-src 'self' app: http://localhost:8080 http://localhost:8081 http://localhost:8082 http://localhost:8083;"
        ]
      }
    });
  });

  // Intercept the 'app' protocol and serve files from the 'dist' directory using the modern `handle` API.
  protocol.handle('app', async (request) => {
    try {
        const url = new URL(request.url);
        // Get the path from the URL, removing the leading slash.
        // e.g., 'app://localhost/index.js' -> '/index.js' -> 'index.js'
        let requestedPath = url.pathname.substring(1);

        // If the path is empty (root request like 'app://localhost'), default to index.html.
        if (requestedPath === '') {
            requestedPath = 'index.html';
        }

        // Decode URI components for filenames with special characters (e.g., spaces).
        const decodedPath = decodeURIComponent(requestedPath);
        
        const buildDir = path.join(app.getAppPath(), 'dist/myapp/browser');
        const filePath = path.join(buildDir, decodedPath);
        
        // Security: Normalize the path and ensure it doesn't access files
        // outside the intended 'dist/myapp/browser' directory (path traversal).
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(buildDir)) {
            console.error(`Access Denied: Path traversal attempt: ${normalizedPath}`);
            return new Response('Access Denied', { status: 403 });
        }

        // Check if the file exists before trying to fetch it.
        await fs.access(normalizedPath);
        
        // Use net.fetch with a file:// URL. This is the most reliable way to
        // serve local files, as it correctly handles MIME types and other details.
        return net.fetch(pathToFileURL(normalizedPath).toString());

    } catch (error) {
        console.error(`Failed to handle 'app' protocol request for ${request.url}:`, error);
        // If the file doesn't exist or there's another error, return a 404.
        return new Response('Not Found', { status: 404 });
    }
  });
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- File System IPC Handlers ---

function resolvePath(relativePath) {
  // path.join is used to handle the case where relativePath is empty (root)
  const fullPath = path.join(rootPath, ...(relativePath || []));
  const resolvedPath = path.resolve(fullPath);
  
  if (!resolvedPath.startsWith(rootPath)) {
    throw new Error('Access denied: path is outside the allowed root directory.');
  }
  return resolvedPath;
}

async function mapDirentToNode(dirent, itemPath) {
    const stats = await fs.stat(itemPath);
    return {
        name: dirent.name,
        type: dirent.isDirectory() ? 'folder' : 'file',
        modified: stats.mtime.toISOString(),
    };
}

// Get contents of a directory
ipcMain.handle('fs:get-contents', async (event, currentPath) => {
  try {
    const dirPath = resolvePath(currentPath);
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    const items = await Promise.all(
        dirents.map(dirent => mapDirentToNode(dirent, path.join(dirPath, dirent.name)))
    );
    return items;
  } catch (err) {
    console.error(`Error getting contents for ${currentPath.join('/')}:`, err);
    throw new Error(err.message);
  }
});

// Get the entire folder tree (with limited depth for performance)
ipcMain.handle('fs:get-folder-tree', async () => {
  const MAX_DEPTH = 3;
  async function buildTree(dirPath, currentDepth) {
    if (currentDepth > MAX_DEPTH) {
      return [];
    }
    try {
      const dirents = await fs.readdir(dirPath, { withFileTypes: true });
      const folders = dirents.filter(d => d.isDirectory());
      const children = await Promise.all(
        folders.map(async folder => {
          const folderPath = path.join(dirPath, folder.name);
          return {
            name: folder.name,
            type: 'folder',
            children: await buildTree(folderPath, currentDepth + 1),
          };
        })
      );
      return children;
    } catch (err) {
        // Ignore permission errors etc.
        return [];
    }
  }

  try {
    return {
      name: 'My Computer',
      type: 'folder',
      children: await buildTree(rootPath, 1),
    };
  } catch (err) {
     console.error(`Error getting folder tree:`, err);
    throw new Error(err.message);
  }
});


ipcMain.handle('fs:create-directory', async (event, dirPath, name) => {
    const newDirPath = path.join(resolvePath(dirPath), name);
    await fs.mkdir(newDirPath);
});

ipcMain.handle('fs:remove-directory', async (event, dirPath, name) => {
    const targetPath = path.join(resolvePath(dirPath), name);
    await fs.rm(targetPath, { recursive: true, force: true });
});

ipcMain.handle('fs:create-file', async (event, dirPath, name) => {
    const newFilePath = path.join(resolvePath(dirPath), name);
    await fs.writeFile(newFilePath, '');
});

ipcMain.handle('fs:delete-file', async (event, dirPath, name) => {
    const targetPath = path.join(resolvePath(dirPath), name);
    await fs.unlink(targetPath);
});

ipcMain.handle('fs:rename', async (event, dirPath, oldName, newName) => {
    const oldPath = path.join(resolvePath(dirPath), oldName);
    const newPath = path.join(resolvePath(dirPath), newName);
    await fs.rename(oldPath, newPath);
});

ipcMain.handle('fs:upload-file', async(event, destPath, file) => {
    const destFilePath = path.join(resolvePath(destPath), file.name);
    await fs.copyFile(file.path, destFilePath);
});

async function copyOrMove(sourcePath, destPath, items, isMove) {
    const sourceDir = resolvePath(sourcePath);
    const destDir = resolvePath(destPath);

    for (const item of items) {
        const sourceItemPath = path.join(sourceDir, item.name);
        const destItemPath = path.join(destDir, item.name);
        if (isMove) {
            await fs.rename(sourceItemPath, destItemPath);
        } else {
            const stats = await fs.stat(sourceItemPath);
            if (stats.isDirectory()) {
                await fs.cp(sourceItemPath, destItemPath, { recursive: true });
            } else {
                await fs.copyFile(sourceItemPath, destItemPath);
            }
        }
    }
}

ipcMain.handle('fs:move', async (event, sourcePath, destPath, items) => {
    await copyOrMove(sourcePath, destPath, items, true);
});

ipcMain.handle('fs:copy', async (event, sourcePath, destPath, items) => {
    await copyOrMove(sourcePath, destPath, items, false);
});

ipcMain.handle('fs:search', async (event, query) => {
    const results = [];
    const lowerCaseQuery = query.toLowerCase();

    async function find(currentDir, currentPathFromRoot) {
        try {
            const dirents = await fs.readdir(currentDir, { withFileTypes: true });
            for (const dirent of dirents) {
                if (dirent.name.toLowerCase().includes(lowerCaseQuery)) {
                    const itemPath = path.join(currentDir, dirent.name);
                    const node = await mapDirentToNode(dirent, itemPath);
                    results.push({ ...node, path: currentPathFromRoot });
                }

                if (dirent.isDirectory()) {
                    await find(path.join(currentDir, dirent.name), [...currentPathFromRoot, dirent.name]);
                }
            }
        } catch (err) {
            // Ignore permission errors
        }
    }

    await find(rootPath, []);
    return results;
});

ipcMain.handle('fs:get-file-content', async (event, currentPath, name) => {
  try {
    const filePath = resolvePath([...(currentPath || []), name]);
    const data = await fs.readFile(filePath);
    const base64 = data.toString('base64');
    
    let mimeType = 'application/octet-stream';
    const ext = path.extname(name).toLowerCase();
    
    // Simple MIME type mapping
    const mimeMap = {
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    };

    if (ext in mimeMap) {
      mimeType = mimeMap[ext];
    }

    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error(`Error getting file content for ${[...(currentPath || []), name].join('/')}:`, err);
    throw new Error(err.message);
  }
});