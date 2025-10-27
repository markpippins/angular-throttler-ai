# Project Root Documentation (`/Gemini.md`)

This document provides a high-level overview of the files located in the project's root directory.

## Core Application Files

### `index.tsx` - Application Entry Point

This is the main entry point for the entire Angular application. Its primary responsibilities are:
- **Bootstrapping:** It uses `bootstrapApplication` to launch the root `AppComponent`.
- **Zoneless Change Detection:** It enables Angular's modern, more performant change detection strategy.
- **Dependency Injection:** It configures application-wide services. In its current configuration, it provides services for remote and virtual file systems (`RemoteFileSystemService`, `InMemoryFileSystemService`), which are then orchestrated by the `AppComponent`.

### `index.html` - Main HTML Document

This is the single HTML page that hosts the application.
- **Root Element:** Contains `<app-root></app-root>`, where the `AppComponent` is rendered.
- **Styling:** Loads **Tailwind CSS** from a CDN and defines a sophisticated theming system using CSS variables for light, dark, and steel themes.

### `metadata.json`

This file contains metadata specific to the AI Studio development environment.

### `package.json`

This is the standard Node.js manifest file, configured for a web-based Angular application using the Angular CLI. It contains all the necessary scripts (`start`, `build`, `test`) and a list of project dependencies.

## Intended Desktop Architecture (Electron)

The project was originally designed to be a cross-platform desktop application using the **Electron** framework. This would have combined the modern Angular frontend with a Node.js backend to provide native operating system capabilities, most importantly, direct access to the user's local file system.

The key files for this architecture were:

### `main.js` - The Electron Main Process

- **Role:** This file acted as the application's backend. Running in a full Node.js environment, it was responsible for creating the native browser window (`BrowserWindow`) and managing all interactions with the operating system.
- **Functionality:** It contained all the logic for file system operations (reading directories, creating/deleting files, renaming, etc.) using Node's built-in `fs` module. It would listen for requests from the frontend via Electron's Inter-Process Communication (IPC) system.

### `preload.js` - The Secure Bridge

- **Role:** This script served as a secure bridge between the web-based renderer process (the Angular app) and the Node.js-based main process (`main.js`).
- **Security:** It used Electron's `contextBridge` to expose a specific, limited API (`window.desktopApi`) to the Angular application. This is a critical security practice that prevents the frontend from having direct access to all of Node.js's powerful (and potentially dangerous) APIs. It essentially creates a whitelist of functions the frontend is allowed to call.

### The Communication Flow

The intended flow for a native file operation was:
1.  An Angular component (e.g., `FileExplorerComponent`) would call a method on the `ElectronFileSystemService`.
2.  The `ElectronFileSystemService` would use the exposed `window.desktopApi.invoke()` method to send a message over an IPC channel (e.g., `'fs:get-contents'`).
3.  The `ipcMain.handle()` listener in `main.js` would catch this message, execute the corresponding Node.js file system code, and return the result.
4.  The result would travel back across the IPC bridge, resolving the `Promise` in the `ElectronFileSystemService`, and updating the Angular UI.
