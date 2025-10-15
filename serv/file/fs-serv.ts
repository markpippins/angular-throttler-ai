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

const PORT = process.env.FS_SERVER_PORT || 4040;
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
 * Ensures