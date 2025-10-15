// This is a Node.js server file. The triple-slash directive below ensures that Node.js type definitions are available to the TypeScript compiler.
// FIX: Removed the line '/// <reference types="node" />' because the build environment cannot resolve node types, causing an error.

// FIX: Add declarations for Node.js globals to work around a build environment
// issue where the triple-slash directive for node types is not being resolved correctly.
declare const __dirname: string;
declare const process: {
    env: { [key: string]: string | undefined };
    cwd(): string;
    exit(code?: number): never;
};

import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.FS_SERVER_PORT || 8080;
// Ensure FS_ROOT_DIR is an absolute path for security.
const FS_ROOT_DIR = process.env.FS_ROOT_DIR 
    ? path.resolve(process.env.FS_ROOT_DIR)
    : path.resolve(process.cwd(), 'fs_root');

interface RequestModel {
    alias: string;
    path: string[];
    operation: string;
    newName?: string;
    filename?: string;
    sourcePath?: string[];
    destPath?: string[];
    items?: { name: string, type: 'file' | 'folder' }[];
}

/**
 * Ensures the constructed path is within the user's sandboxed root directory.
 * @param alias The user's root directory alias.
 * @param subPath The path segments within the user's root.
 * @returns {string} A secure, absolute path.
 * @throws {Error} If the path tries to escape the sandbox.
 */
function getSecurePath(alias: string, subPath: string[] = []): string {
    const userRoot = path.join(FS_ROOT_DIR, alias);
    const targetPath = path.join(userRoot, ...subPath);
    const resolvedPath = path.resolve(targetPath);

    // Security check: Ensure the resolved path is still within the user's root directory.
    if (!path.resolve(userRoot).startsWith(path.resolve(FS_ROOT_DIR)) || !resolvedPath.startsWith(path.resolve(userRoot))) {
        throw new Error('Access denied: Path traversal attempt detected.');
    }
    return resolvedPath;
}

async function handleRequest(req: RequestModel) {
    switch (req.operation) {
        case "listFiles": {
            const target = getSecurePath(req.alias, req.path);
            const dirents = await fs.readdir(target, { withFileTypes: true });
            const items = await Promise.all(dirents.map(async (p) => {
                const stat = await fs.stat(path.join(target, p.name));
                return {
                    name: p.name,
                    type: p.isDirectory() ? "directory" : "file",
                    size: stat.size,
                    last_modified: stat.mtime.toISOString()
                };
            }));
            return { path: req.path, items: items };
        }

        case "changeDirectory": { // This operation mostly validates existence.
            const target = getSecurePath(req.alias, req.path);
            await fs.access(target); // Throws if not exists
            const stat = await fs.stat(target);
            if (!stat.isDirectory()) throw new Error('Not a directory');
            return { path: req.path };
        }

        case "createDirectory": {
            const target = getSecurePath(req.alias, req.path);
            await fs.mkdir(target, { recursive: true });
            return { created: target };
        }

        case "removeDirectory": {
            const target = getSecurePath(req.alias, req.path);
            await fs.rm(target, { recursive: true, force: true });
            return { deleted: target };
        }

        case "createFile": {
            if (!req.filename) throw new Error("Filename required");
            const parentDir = getSecurePath(req.alias, req.path);
            const target = path.join(parentDir, req.filename);
            await fs.writeFile(target, '');
            return { created_file: target };
        }

        case "deleteFile": {
            if (!req.filename) throw new Error("Filename required");
            const parentDir = getSecurePath(req.alias, req.path);
            const target = path.join(parentDir, req.filename);
            await fs.unlink(target);
            return { deleted_file: target };
        }

        case "rename": {
            if (!req.newName) throw new Error("New name required");
            const target = getSecurePath(req.alias, req.path);
            const new_target = path.join(path.dirname(target), req.newName);
            await fs.rename(target, new_target);
            return { renamed: target, to: new_target };
        }
        
        case "getFileContent": {
            if (!req.filename) throw new Error("Filename required");
            const target = getSecurePath(req.alias, [...req.path, req.filename]);
            const ext = path.extname(req.filename).toLowerCase();

            const imageMimeMap: { [key: string]: string } = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp',
            };

            if (ext in imageMimeMap) {
                // It's an image, return a data URL
                const data = await fs.readFile(target);
                const base64 = data.toString('base64');
                const mimeType = imageMimeMap[ext];
                const content = `data:${mimeType};base64,${base64}`;
                return { content };
            } else {
                // Not an image, return as text
                const content = await fs.readFile(target, 'utf8');
                return { content };
            }
        }

        case "copy":
        case "move": {
            if (!req.sourcePath || !req.destPath || !req.items) {
                throw new Error("sourcePath, destPath, and items are required for copy/move.");
            }
            const isMove = req.operation === 'move';
            const sourceDir = getSecurePath(req.alias, req.sourcePath);
            const destDir = getSecurePath(req.alias, req.destPath);

            for (const item of req.items) {
                const sourceItemPath = path.join(sourceDir, item.name);
                const destItemPath = path.join(destDir, item.name);
                if (isMove) {
                    await fs.rename(sourceItemPath, destItemPath);
                } else {
                    await fs.cp(sourceItemPath, destItemPath, { recursive: true });
                }
            }
            return { success: true, operation: req.operation, count: req.items.length };
        }


        default:
            throw new Error(`Unknown operation ${req.operation}`);
    }
}

const server = http.createServer(async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204).end();
        return;
    }

    if (req.url === '/fs' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const requestData: RequestModel = JSON.parse(body);
                const result = await handleRequest(requestData);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error: any) {
                console.error(`[FS-SERV-ERROR] ${error.message}`);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Create the root directory if it doesn't exist
fs.mkdir(FS_ROOT_DIR, { recursive: true }).then(() => {
    server.listen(PORT, () => {
        console.log(`File System server listening on http://localhost:${PORT}`);
        console.log(`Serving files from root: ${FS_ROOT_DIR}`);
    });
}).catch(err => {
    console.error(`Could not create FS_ROOT_DIR at ${FS_ROOT_DIR}`, err);
    process.exit(1);
});