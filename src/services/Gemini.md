# `services` Directory Documentation (`/src/services/Gemini.md`)

This directory is the logical core of the application, containing all the injectable Angular services. These services encapsulate business logic, API communication, and shared state management, keeping the components lean and focused on presentation. All services are registered as singletons at the root level (`providedIn: 'root'`).

## Core Architectural Services

### `file-system-provider.ts`

-   **Purpose:** Defines the `FileSystemProvider` **abstract class**. This is a critical piece of the application's architecture. It acts as a "contract" or an interface that any file system service must adhere to.
-   **API:** It declares abstract methods for all file system operations (`getContents`, `rename`, `copy`, `move`, etc.).
-   **Benefit:** By having components depend on this abstraction rather than a concrete implementation, the application can seamlessly switch between different file systems (like local and remote) without changing any of the UI component code.

### `electron-file-system.service.ts`

-   **Purpose:** An implementation of `FileSystemProvider` that **simulates a local file system in memory**.
-   **Role:** This service is used when the application is in "Local File System" mode. It provides a fully interactive mock of a file system, allowing for complete development and testing of all UI features (creating folders, renaming, copy/paste) without needing the actual Electron framework or a real file system. It manipulates a private `root` object that holds the file structure in memory.

### `remote-file-system.service.ts`

-   **Purpose:** An implementation of `FileSystemProvider` that communicates with a remote backend.
-   **Role:** This service is used when the application is in "Remote Connection" mode. Each of its methods (`getContents`, `rename`, etc.) is implemented by making a call to the lower-level `FsService`, which in turn sends a request to the configured remote broker.

## State Management Services

### `clipboard.service.ts`

-   **Purpose:** A stateful service that acts as a global, application-wide clipboard.
-   **State:** It holds a `signal` containing the `ClipboardPayload`, which includes the items being transferred, the source path, the source provider, and the operation type (`'cut'` or `'copy'`).
-   **Benefit:** Because it's a singleton service, any component can inject it to read from or write to the clipboard. This is what enables a user to "copy" a file in one file explorer pane and "paste" it in the other.

### `server-profile.service.ts`

-   **Purpose:** A stateful service for all CRUD (Create, Read, Update, Delete) operations related to `ServerProfile`s.
-   **State:** It holds signals for the list of all `profiles` and the `activeProfileId`. It uses a `computed` signal (`activeProfile`) to derive the full active profile object.
-   **Persistence:** It uses an `effect` to automatically save all profiles and the active ID to the browser's `localStorage` whenever they change, ensuring they persist between sessions.

## API Client Services

### `broker.service.ts`

-   **Purpose:** A generic, low-level client for making requests to the backend message broker.
-   **Functionality:** Its `submitRequest` method constructs a request payload, gets the correct broker URL from the `ServerProfileService`, and uses the `fetch` API to send the request. It also handles basic response validation.

### `fs.service.ts`

-   **Purpose:** An API client specifically for the `restFsService` on the backend.
-   **Functionality:** It provides strongly-typed methods for each file system operation (e.g., `listFiles`, `createDirectory`). Each method calls the generic `brokerService.submitRequest` with the correct service name (`restFsService`) and operation name. It acts as a typed wrapper around the generic broker.

### `image-client.service.ts` & `image.service.ts`

-   **Purpose:** A pair of services for resolving file icon URLs.
-   **`ImageClientService`:** A low-level client that knows how to construct the specific URL paths for the image server (e.g., `/ext/...`, `/name/...`). It gets the base image server URL from the `ServerProfileService`.
-   **`ImageService`:** A higher-level service that contains the logic. It takes a `FileSystemNode` and decides *which* icon to request. For example, if the node is a folder, it calls `imageClientService.getImageUrlByName('folder')`. If it's a file, it extracts the extension and calls `imageClientService.getImageUrlByExtension(...)`.
