# Throttler - A Web-Based File Explorer

Throttler is a modern, web-based file explorer clone inspired by the Windows Explorer interface. It's built with Angular and features a dynamic, component-based architecture that allows for navigating both a mock local file system and a remote file system.

This version is a pure web application that runs in any modern browser.

## Key Features

- **Modern Angular:** Built with the latest standalone components, signals for state management, and zoneless change detection for high performance.
- **Virtual & Remote File Systems:** Seamlessly navigate and manage files across a virtual "Convex Pins" system and any number of user-configured remote servers.
- **Dual Pane View:** Toggle between a single or a split-view interface to manage files across two directories simultaneously.
- **Theming:** Choose between Light, Steel, and Dark themes to customize the user interface. The selected theme is persisted in local storage.
- **File Operations:** Supports creating files/folders, renaming, deleting, cut, copy, and paste on supported remote file systems.
- **Drag & Drop:** Upload files by dragging them from your desktop into the explorer.
- **Lasso Selection:** Click and drag in an empty area to select multiple items.
- **Details Pane:** A slide-out pane provides details and an image preview for the selected file.
- **Search:** Perform quick searches or open a detailed search dialog to find files within a file system.

## Running the Application

This is a web application built with Angular.

### Prerequisites

You must have [Node.js](https://nodejs.org/) and npm (or a compatible package manager) installed.

### 1. Installation

First, install the necessary dependencies from the project's root directory:

```bash
npm install
```

### 2. Compiling TypeScript

Before serving, you need to compile the TypeScript files into JavaScript:
```bash
npm run tsc
```
This will create the compiled output in the `app/` directory.

### 3. Serving the Application

After compiling, you need a local web server to serve the project's root directory. You can use any static server. For example, using the popular `http-server` package via `npx`:

```bash
npx http-server .
```

Then, open your browser to the URL provided (e.g., `http://localhost:8080`).

### Optional: Running Backend Services

For the "Remote Connection" mode and for fetching custom file icons, the application relies on two backend services.

#### Image Server

This is a simple Node.js server that dynamically generates SVG icons.

To start it, open a new terminal in the project's root directory and run:

```bash
node serv/image-serv.js
```

You should see the message `Image server listening on http://localhost:8081`.

#### Broker & File System Service

For remote mode, the app needs a compatible message broker. The default configuration points to `http://localhost:8080`.
