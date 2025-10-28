# Throttler - A Web-Based File Explorer

Throttler is a modern, web-based file explorer clone inspired by the Windows Explorer interface. It's built with Angular and features a dynamic, component-based architecture that allows for navigating both a mock local file system and a remote file system.

## Key Design Goals & Features

- **Modern Angular:** Built with the latest standalone components, signals for state management, and zoneless change detection for high performance.
- **Virtual & Remote File Systems:** Seamlessly navigate and manage files across a virtual "Session" system (persisted in browser storage) and any number of user-configured remote servers.
- **Dual Pane View:** Toggle between a single or a split-view interface to manage files across two directories simultaneously.
- **Theming:** Choose between Light, Steel, and Dark themes to customize the user interface. The selected theme is persisted in local storage.
- **Comprehensive File Operations:** Supports creating files/folders, renaming, deleting, cut, copy, and paste on supported file systems.
- **Drag & Drop:** Upload files by dragging them from your desktop into the explorer.
- **File Search:** A search bar is available to quickly find files within the current location.

## Running the Application (Web Version)

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
npm start
```

This will compile the application, start a development server, and open your default browser to the application, typically at `http://localhost:4200`. The server will automatically reload when you save changes to the source files.