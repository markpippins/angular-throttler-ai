# `serv` Directory Documentation (`/serv/Gemini.md`)

This directory contains server-side code written in TypeScript, intended to be run with Node.js. It is part of the application's backend infrastructure.

## `image-serv.ts` - Dynamic SVG Icon Server

This file implements a lightweight HTTP server responsible for generating and serving SVG icons on the fly.

### Core Responsibilities

1.  **HTTP Server:** It uses Node.js's built-in `http` module to create a server that listens for incoming requests.
2.  **Request Routing:** It parses the URL of incoming requests to determine what kind of icon is being requested. It supports several endpoints:
    -   `/name/:name`: Requests a generic icon by name (e.g., 'folder', 'file').
    -   `/ext/:extension`: Requests an icon for a specific file extension (e.g., 'txt', 'pdf', 'jpg').
    -   `/path/...`: Another routing variant.
3.  **SVG Generation:** It contains a helper function, `generateSvg`, that creates an SVG image as a string. The SVG typically consists of a colored background rectangle and a short text label (like the file extension).
4.  **Response Handling:** It sends the generated SVG string back to the client with the correct `Content-Type` header (`image/svg+xml`).

### Interaction with the Frontend

-   The Angular application's `ImageClientService` constructs URLs that point to this server. For example, when the frontend needs an icon for a `.txt` file, it might generate a URL like `http://localhost:8081/ext/txt`.
-   The browser then makes a standard HTTP GET request to that URL, and this server responds with the dynamically created SVG image.
