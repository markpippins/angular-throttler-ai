# `serv` Directory Documentation (`/serv/Gemini.md`)

This directory contains server-side code written in TypeScript, intended to be run with Node.js. It is part of the application's backend infrastructure.

## `image-serv.ts` - Dynamic SVG Icon Server

This file implements a lightweight HTTP server responsible for generating and serving SVG icons on the fly.

### Core Responsibilities

1.  **HTTP Server:** It uses Node.js's built-in `http` module to create a server that listens for incoming requests.
2.  **Request Routing:** It parses the URL of incoming requests to determine what kind of icon is being requested. It supports several endpoints:
    -   `/ui/:name`: **(New)** Requests a specific UI icon (e.g., for 'Home', 'Desktop'). It checks a whitelist of allowed names. If a name is valid, it attempts to serve a corresponding static image from a dedicated `/images/ui` subdirectory.
    -   `/name/:name`: Requests an icon by a specific name. This is used by the frontend to request icons for uniquely named folders (e.g., 'My Documents') or for files that lack an extension. It first attempts to serve a static image from the `images` root directory.
    -   `/ext/:extension`: Requests an icon for a specific file extension (e.g., 'txt', 'pdf', 'jpg'). It also attempts to serve a matching static image first.
3.  **Static File Serving & SVG Fallback:** For each endpoint, the server first attempts to find a matching static image file (e.g., `.png`, `.svg`). If a static file is not found, it dynamically generates a fallback SVG image as a response.
4.  **SVG Generation:** It contains a helper function, `generateSvg`, that creates an SVG image as a string. The SVG typically consists of a colored background rectangle and a short text label.
5.  **Response Handling:** It sends the image (either static or generated) back to the client with the correct `Content-Type` header.

### Interaction with the Frontend

-   The Angular application's `ImageClientService` constructs URLs that point to this server. For example, when the frontend needs an icon for a `.txt` file, it generates a URL like `http://localhost:8081/ext/txt`. A request for the "Home" icon would generate `http://localhost:8081/ui/Home`.
-   The browser then makes a standard HTTP GET request to that URL, and this server responds with the appropriate image.