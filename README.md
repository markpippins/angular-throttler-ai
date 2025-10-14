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

For full "Remote Connection" functionality, the application relies on a suite of backend microservices. Each should be run in its own terminal after being compiled from TypeScript to JavaScript (which the `ng build` or `ng serve` process handles).

1.  **File System Service:** Handles file operations for remote connections. The default server profile expects this to be accessible via the broker URL.
    ```bash
    node app/serv/file/fs-serv.js
    ```

2.  **Image Server:** Serves static and dynamically generated icons.
    ```bash
    node app/serv/image/image-serv.js
    ```
    _Note: There may be a duplicate `image-serv.ts` file in the `serv` root. This command refers to the one inside `serv/image/`._
    
The application is pre-configured with a "Local (Debug)" server profile that expects a broker at `http://localhost:8080` and the image server at `http://localhost:8081`.

The project also includes other backend services that are not fully integrated into the UI but can be run for development and testing:

- **Google Search Service:** This service acts as a proxy to the live Google Custom Search API. To enable it, you must create a `.env` file in the project root and add your credentials:
  ```
  GOOGLE_API_KEY=your_api_key_here
  SEARCH_ENGINE_ID=your_search_engine_id_here
  ```
  Then run the service:
  ```bash
  # Google Search Service (runs on port 8082)
  node app/serv/search/gsearch-serv.js
  ```

- **Unsplash Image Search Service (Mock):** This service returns mock data.
  ```bash
  # Mock Unsplash Image Search Service (runs on port 8083)
  node app/serv/unsplash/image-search.js
  ```