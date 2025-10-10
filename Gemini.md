# Project Root Documentation (`/Gemini.md`)

This document provides a high-level overview of the files located in the project's root directory.

## Core Files

### `index.tsx` - Application Entry Point

This is the main entry point for the entire Angular application. Its primary responsibilities are:
- **Bootstrapping:** It uses the `bootstrapApplication` function from `@angular/platform-browser` to launch the root `AppComponent`.
- **Zoneless Change Detection:** It calls `provideZonelessChangeDetection()` to enable Angular's modern, more performant change detection strategy, which avoids reliance on `zone.js`.
- **Dependency Injection:** It configures the root dependency injector with application-wide services and configuration values.
    - `IS_DEBUG_MODE`: Provides a boolean flag for debugging purposes.
    - `ElectronFileSystemService`: Provides the service responsible for handling local file system operations (currently a mock).
    - `RemoteFileSystemService`: Provides the service for interacting with remote file systems via a broker.
    The `AppComponent` then dynamically chooses which of these file system services to use based on the current connection state.

### `index.html` - Main HTML Document

This is the single HTML page that hosts the application.
- **Root Element:** It contains `<app-root></app-root>`, which is the selector where the bootstrapped `AppComponent` will be rendered.
- **Styling:** It includes a `<script>` tag to load **Tailwind CSS** from a CDN, which is the exclusive styling library for this project.
- **Module Loading:** It uses an **import map** (`<script type="importmap">`) to define aliases for JavaScript module imports. This allows for bare module specifiers (e.g., `import { Component } from '@angular/core';`) to work directly in the browser by mapping them to specific CDN URLs. This setup avoids the need for a complex local build/bundling step for dependencies.

### `metadata.json`

This file contains metadata specific to the AI Studio development environment, such as the application's name and description.
