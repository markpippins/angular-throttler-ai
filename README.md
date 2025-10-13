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

This is a web application built with the Angular CLI.

### Prerequisites

You must have [Node.js](https://nodejs.org/) and npm (or a compatible package manager) installed.

### 1. Installation

First, install the necessary dependencies from the project's root directory:

```bash
npm install
```

### 2. Running the Development Server

To start the local development server, run the following command:

```bash
npm run dev
```

This will compile the application, start a development server, and open your default browser to the application, typically at `http://localhost:4200`. The server will automatically reload when you save changes to the source files.

### 3. Building for Production

To create a production-ready build, run:

```bash
npm run build
```
This will compile and optimize the application, placing the output in the `dist/` directory. You can then deploy the contents of this directory to any static web hosting service.

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