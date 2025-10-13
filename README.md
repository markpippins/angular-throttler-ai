# Throttler - A Web-Based File Explorer

Throttler is a modern, web-based file explorer clone inspired by the Windows Explorer interface. It's built with Angular and features a dynamic, component-based architecture that allows for navigating both a mock local file system and a remote file system.

This version is packaged as a desktop application using **Electron**, giving it access to the local file system.

## Key Features

- **Modern Angular:** Built with the latest standalone components, signals for state management, and zoneless change detection for high performance.
- **Real File System Access:** As an Electron app, it can browse and manage files and folders directly on your computer.
- **Dual Pane View:** Toggle between a single or a split-view interface to manage files across two directories simultaneously.
- **Local & Remote Modes:** Seamlessly switch between the local file system and a remote file system that communicates with a backend broker.
- **Theming:** Choose between Light, Steel, and Dark themes to customize the user interface. The selected theme is persisted in local storage.
- **Full File Operations:** Supports creating files/folders, renaming, deleting, cut, copy, and paste on the local file system.
- **Drag & Drop:** Upload files by dragging them from your desktop into the explorer or directly onto a folder.
- **Lasso Selection:** Click and drag in an empty area to select multiple items.
- **Details Pane:** A slide-out pane provides details and an image preview for the selected file.
- **Search:** Perform quick searches or open a detailed search dialog to find files on your local drive.

## Running the Application

This project is an Electron application.

### Prerequisites

You must have [Node.js](https://nodejs.org/) and npm (or a compatible package manager) installed.

### 1. Installation

First, install the necessary dependencies from the project's root directory:

```bash
npm install
```

### 2. Running in Development Mode

To start the application, run the following command. This will launch the Electron window with the Angular app loaded.

```bash
npm start
```

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

### 3. Building for Production

You can build a distributable, platform-specific package (e.g., an `.exe` for Windows, `.dmg` for macOS) using `electron-builder`.

Run the build command:

```bash
npm run build
```

The packaged application will be located in the `dist` directory.
