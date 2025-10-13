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

This project is a monorepo-style setup with two main parts: the Angular frontend application (in the root) and the Electron desktop wrapper (in the `electron/` directory). The development process requires running three processes concurrently in separate terminals.

### Prerequisites

You must have [Node.js](https://nodejs.org/) and npm (or a compatible package manager) installed.

### 1. Installation

You need to install dependencies for both the Angular app and the Electron app.

```bash
# 1. Install frontend dependencies from the project root
npm install

# 2. Install Electron dependencies
cd electron
npm install
cd ..
```

### 2. Running for Development

Open three separate terminal windows in the project's root directory.

**Terminal 1: Compile TypeScript**
This terminal will watch your TypeScript files and recompile them into JavaScript whenever you save a change.

```bash
# In the root directory
npm run watch
```

**Terminal 2: Start the Web Server**
This terminal serves the compiled frontend on a local web server, which the Electron app will load.

```bash
# In the root directory
npm run serve
```
This will serve the application at `http://localhost:8080`.

**Terminal 3: Start the Electron App**
This terminal runs the actual desktop application.

```bash
# First, change into the electron directory
cd electron

# Then, start the app
npm start
```

This will launch the desktop application window, which will load its content from `http://localhost:8080`. You can now make changes to the Angular code, which will be recompiled automatically. To see the changes, reload the Electron window (View > Reload or `Ctrl/Cmd+R`).

## Building for Production

Building a distributable package is a two-step process.

**1. Compile the Angular App**
First, run the TypeScript compiler to build the production-ready JavaScript files.

```bash
# In the root directory
npm run tsc
```

**2. Build the Electron App**
Next, from the `electron` directory, run the build script. This will package your compiled Angular app into a distributable file (e.g., `.exe` for Windows, `.dmg` for macOS).

```bash
# Change into the electron directory
cd electron

# Run the build command
npm run build
```

The final packaged application will be located in the `dist/` directory at the project root.