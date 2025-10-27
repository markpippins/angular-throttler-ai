# `services` Directory Documentation (`/src/services/Gemini.md`)

This directory is the logical core of the application, containing all the injectable Angular services. These services encapsulate business logic, API communication, and shared state management, keeping the components lean and focused on presentation. All services are registered as singletons at the root level (`providedIn: 'root'`).

## Core Architectural Services

### `file-system-provider.ts`

-   **Purpose:** Defines the `FileSystemProvider` **abstract class**. This is a critical piece of the application's architecture. It acts as a "contract" or an interface that any file system service must adhere to.
-   **API:** It declares abstract methods for all file system operations (`getContents`, `rename`, `copy`, `move`, etc.).
-   **Benefit:** By having components depend on this abstraction rather than a concrete implementation, the application can seamlessly switch between different file systems without changing any of the UI component code.

### `electron-file-system.service.ts`

-   **Purpose:** An implementation of `FileSystemProvider` that provides access to the user's **local file system** when running in Electron.
-   **Role:** This service acts as a wrapper around the `ElectronDesktopService`. It translates the `FileSystemProvider` method calls into IPC requests that are sent to the Electron main process via the secure preload script bridge. **Note: This service is not currently used in the web application's default configuration.**

### `in-memory-file-system.service.ts`

-   **Purpose:** An implementation of `FileSystemProvider` that creates a complete, writable virtual file system that persists in the browser's `localStorage`.
-   **Role:** This service provides the default "Session" drive in the application. It manages a hierarchical tree of files and folders in an Angular Signal. All file operations (create, rename, delete, move, copy) are handled through robust, immutable update patterns, ensuring that the UI reacts reliably to every change. The entire file system state is serialized to JSON and saved to `localStorage`, so any changes made by the user are preserved between sessions.

### `remote-file-system.service.ts`

-   **Purpose:** An implementation of `FileSystemProvider` that communicates with a generic remote backend via the broker.
-   **Role:** This service is instantiated by the `AppComponent` when a user "mounts" a server profile. Crucially, if the mount is performed after a user login, it associates the connection with that user. It then uses the **user's username** as the `alias` for all backend file system requests, effectively creating a secure, sandboxed file system for each user. If no user is logged in for the profile (e.g., on an auto-connected profile), it falls back to using the profile's name as the alias.

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

### `login.service.ts`

-   **Purpose:** A client for the backend `loginService`.
-   **Functionality:** It provides a `login` method that sends a username and password to the broker. On success, it receives and returns a `User` object, which contains the authenticated user's details.

### `broker.service.ts`

-   **Purpose:** A generic, low-level client for making requests to the backend message broker.
-   **Functionality:** Its `submitRequest` method constructs a request payload and uses the `fetch` API to send the request to a given `brokerUrl`. It is stateless and relies on the calling service (like `FsService`) to provide the correct URL for the request.

### `fs.service.ts`

-   **Purpose:** An API client specifically for the `restFsService` on the backend, used by `RemoteFileSystemService`.
-   **Functionality:** It provides strongly-typed methods for each file system operation (e.g., `listFiles`, `createDirectory`). Each method calls the generic `brokerService.submitRequest` with the correct service name, operation name, and server URL.

### `image-client.service.ts` & `image.service.ts`

-   **Purpose:** A pair of services for resolving file icon URLs.
-   **`ImageClientService`:** A low-level, stateless client that knows how to construct the specific URL paths for the image server. It includes methods for getting icons by name, extension, or for specific UI elements. It receives the base `imageUrl` as a parameter for each call.
-   **`ImageService`:** A higher-level service *class* (not a singleton) that contains the presentation logic for resolving icons. An instance of this class is created for each file explorer pane, holding a specific `ServerProfile`. Its `getIconUrl` method implements the following logic, in order of priority:
    -   **Local Theme Icons:** It first checks for an active icon theme set in `preferences.json`. If a theme is active and the item is a folder, it constructs a path to a local SVG asset from `src/assets/images/ui/{theme}/{folder_name}.svg`.
    -   **Remote `.magnet` Icons:** If no local theme icon applies, it checks if the item is a folder ending with `.magnet`. If so, it uses the `ImageClientService` to request a remote icon by the folder's name from the configured image server.
    -   **Default:** For all other cases (e.g., files), it returns `null`, allowing the UI component to render a default fallback icon.