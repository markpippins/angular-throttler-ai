# `models` Directory Documentation (`/src/models/Gemini.md`)

This directory contains the TypeScript `interface` and `type` definitions that establish the core data models for the entire application. Defining these structures provides strong typing, improves code clarity, and prevents common errors.

## Core Models

### `file-system.model.ts`

-   **`FileType`**: A string literal type (`'folder' | 'file'`) that ensures the `type` property of a node can only be one of these two values.
-   **`FileSystemNode`**: This is the most fundamental interface in the application. It defines the shape of an object representing a file or a folder.
    -   `name: string`: The name of the file or folder.
    -   `type: FileType`: The type of the node.
    -   `children?: FileSystemNode[]`: An **optional** array of child nodes. This property only exists if the `type` is `'folder'`. The recursive nature of this interface (`FileSystemNode` can contain other `FileSystemNode`s) allows it to represent an entire directory tree.
    -   `content?: string`: Optional content for files.
    -   `modified?: string`: An optional modification timestamp.

### `server-profile.model.ts`

-   **`ServerProfile`**: This interface defines the structure of a connection profile for a remote server.
    -   `id: string`: A unique identifier for the profile.
    -   `name: string`: A user-friendly name for the profile (e.g., "Production Server").
    -   `brokerUrl: string`: The base URL for the backend message broker (e.g., `http://localhost:8080`). The service layer is responsible for appending the specific API path.
    -   `imageUrl: string`: The base URL for the image server associated with this profile.
