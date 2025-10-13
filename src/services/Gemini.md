# `services` Directory Documentation (`/src/services/Gemini.md`)

This directory is the logical core of the application, containing all the injectable Angular services. These services encapsulate business logic, API communication, and shared state management, keeping the components lean and focused on presentation. All services are registered as singletons at the root level (`providedIn: 'root'`).

## Core Architectural Services

### `file-system-provider.ts`

-   **Purpose:** Defines the `FileSystemProvider` **abstract class**. This is a critical piece of the application's architecture. It acts as a "contract" or an interface that any file system service must adhere to.
-   **API:** It declares abstract methods for all file system operations (`getContents`, `rename`, `copy`, `move`, etc.).
-   **Benefit:** By having components depend on this abstraction rather than a concrete implementation, the application can seamlessly switch between different file systems without changing any of the UI component code.

### `electron-file-system.service.ts`

-   **Purpose:** An implementation of `FileSystemProvider` that provides access to the user's **local file system**.
-   **Role:** This service acts as a wrapper around the `ElectronDesktopService`. It translates the `FileSystemProvider` method calls into IPC requests that are sent to the Electron main process via the secure preload script bridge. This is the service used for the "Local Filesystem" root in the explorer.

### `convex-desktop.service.ts`

-   **Purpose:** An implementation of `FileSystemProvider` that represents data from a **Convex backend** as a file system.
-   **Role:** This service fetches "magnet" data from the `ConvexService` and dynamically builds a *virtual file system*. In this virtual system, folders represent tags, and the files (`.magnet`) are the individual data records. It is used for the "Convex Pins" root and is mostly read-only.

### `remote-file-system.service.ts`

-   **Purpose:** An implementation of `FileSystemProvider` that communicates with a generic remote backend via the broker.
-   **Role:** This service is part of the framework for connecting to different server profiles. It is not currently used in the main dual-root explorer view (which favors the `ConvexDesktopService` for its remote data), but it remains available for extending the application with other remote backend types.

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

### `convex.service.ts`

-   **Purpose:** A low-level client for fetching data from the Convex backend.
-   **Functionality:** It's responsible for the actual communication with Convex. Currently, it returns mock data to allow for UI development without a live backend, but it is designed to be replaced with live API calls to Convex's cloud functions.

### `broker.service.ts`

-   **Purpose:** A generic, low-level client for making requests to the backend message broker used by the `RemoteFileSystemService`.
-   **Functionality:** Its `submitRequest` method constructs a request payload, gets the broker URL from the active `ServerProfileService` profile, and uses the `fetch` API to send the request.

### `fs.service.ts`

-   **Purpose:** An API client specifically for the `restFsService` on the backend, used by `RemoteFileSystemService`.
-   **Functionality:** It provides strongly-typed methods for each file system operation (e.g., `listFiles`, `createDirectory`). Each method calls the generic `brokerService.submitRequest` with the correct service and operation names.

### `image-client.service.ts` & `image.service.ts`

-   **Purpose:** A pair of services for resolving file icon URLs.
-   **`ImageClientService`:** A low-level client that knows how to construct the specific URL paths for the image server (e.g., `/ext/...`, `/name/...`). It gets the base image server URL from the `ServerProfileService`.
-   **`ImageService`:** A higher-level service that contains the logic. It takes a `FileSystemNode` and decides *which* icon to request.