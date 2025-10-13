# Throttler - An Electron-Based File Explorer

Throttler is a modern, desktop file explorer clone inspired by the Windows Explorer interface. It's built with Angular for the frontend and wrapped with Electron to create a cross-platform desktop application. It features a dynamic, component-based architecture that allows for navigating both a mock local file system and a remote file system.

## Key Features

- **Modern Angular Frontend:** Built with the latest standalone components, signals for state management, and zoneless change detection for high performance.
- **Electron Wrapper:** Runs as a native desktop application with access to the local file system.
- **Virtual & Remote File Systems:** Seamlessly navigate and manage files across a virtual "Convex Pins" system and any number of user-configured remote servers.
- **Dual Pane View:** Toggle between a single or a split-view interface to manage files across two directories simultaneously.
- **Theming:** Choose between Light, Steel, and Dark themes. The selected theme is persisted in local storage.
- **File Operations:** Supports creating files/folders, renaming, deleting, cut, copy, paste, drag & drop uploads, and more.

## Running the Application

This is an Electron application that loads a web-based frontend. The development process involves running a local web server for the frontend and the Electron process separately.

### Prerequisites

You must have [Node.js](https://nodejs.org/) and npm (or a compatible package manager) installed.

### 1. Installation

First, install the necessary dependencies from the project's root directory:

```bash
npm install
```

### 2. Compiling TypeScript

The Angular application's TypeScript files need to be compiled into JavaScript. You can run this once, or run it in watch mode in a dedicated terminal to automatically recompile on changes.

```bash
# Compile once
npm run tsc

# Or, compile and watch for changes
npm run tsc -- --watch
```
This will create and update the compiled output in the `app/` directory.

### 3. Running the Development Server

The Electron app, in development mode, loads the frontend from a local web server. In a new terminal, start a static server in the project's root directory.

```bash
# Using the popular http-server package via npx
npx http-server .
```

This will typically serve the application at `http://localhost:8080`.

### 4. Starting the Electron App

With the compiler running (in watch mode) and the web server active, you can start the Electron application. In a third terminal, run:

```bash
npm start
```

This will launch the desktop application, which will load the UI from your local web server. Changes to your Angular code will be recompiled by `tsc`, and you can simply reload the Electron window (Ctrl/Cmd+R) to see the updates.

## Building for Production

To create a distributable, packaged application (e.g., `.exe`, `.dmg`), run the following command:

```bash
npm run build
```

This will first compile the TypeScript code and then use `electron-builder` to package the application. The output will be located in the `dist/` directory.