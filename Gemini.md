# Project Root Documentation (`/Gemini.md`)

This document provides a high-level overview of the files located in the project's root directory.

## Core Application Files

### `index.tsx` - Application Entry Point

This is the main entry point for the entire Angular application. Its primary responsibilities are:
- **Bootstrapping:** It uses `bootstrapApplication` to launch the root `AppComponent`.
- **Zoneless Change Detection:** It enables Angular's modern, more performant change detection strategy.
- **Dependency Injection:** It configures application-wide services. In its current configuration, it provides services for remote and virtual file systems (`RemoteFileSystemService`, `ConvexDesktopService`), which are then orchestrated by the `AppComponent`.

### `index.html` - Main HTML Document

This is the single HTML page that hosts the application.
- **Root Element:** Contains `<app-root></app-root>`, where the `AppComponent` is rendered.
- **Styling:** Loads **Tailwind CSS** from a CDN and defines a sophisticated theming system using CSS variables for light, dark, and steel themes.
- **Module Loading:** Uses an **import map** (`<script type="importmap">`) to define aliases for JavaScript module imports, allowing bare module specifiers to work directly in the browser.

### `metadata.json`

This file contains metadata specific to the AI Studio development environment.

## Electron Desktop Application Files (Available but Inactive)

These files exist in the project to support turning the web application into a cross-platform desktop application using the Electron framework. **Note: These services are not currently enabled in the application's bootstrap configuration.**

### `package.json`

This is the standard Node.js manifest file. For this project, it's configured for a web-based Angular application using the Angular CLI. The Electron-specific dependencies are not currently included.

### `main.js` - Electron Main Process

This is the backbone of the desktop application. It runs in a Node.js environment and has full access to the operating system.
- **Window Management:** It creates and manages the application's native window (`BrowserWindow`).
- **File System Backend:** It listens for requests from the Angular application (the renderer process) via IPC (Inter-Process Communication). It uses Node.js's `fs/promises` and `path` modules to perform all real file system operations (reading directories, creating/deleting files, etc.) rooted in the user's home directory. It then sends the results back to the renderer. This isolates all OS-level interactions to the main process for security and performance.

### `preload.js` - Secure Bridge

This script acts as a secure bridge between the renderer process (web content) and the main process (Node.js).
- **Context Bridging:** It uses Electron's `contextBridge` to safely expose a limited, custom API (in this case, `window.desktopApi`) to the Angular application.
- **Security:** It allows the renderer to trigger file system operations by calling `window.desktopApi.invoke(...)` without giving it direct access to the powerful `ipcRenderer` or other Node.js APIs, which is a critical security best practice. It maintains a whitelist of allowed IPC channels.