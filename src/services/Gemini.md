# `services` Directory Documentation (`/src/services/Gemini.md`)

This directory is the logical core of the application, containing all the injectable Angular services. These services encapsulate business logic, API communication, and shared state management, keeping the components lean and focused on presentation. All services are registered as singletons at the root level (`providedIn: 'root'`).

## Core Architectural Services

### `file-system-provider.ts`

-   **Purpose:** Defines the `FileSystemProvider` **abstract class**. This is a critical piece of the application's architecture. It acts as a "contract" or an interface that any file system service must adhere to.
-   **API:** It declares abstract methods for all file system operations (`getContents`, `rename`, `copy`, `move`, etc.).
-   **Benefit:** By having components depend on this abstraction rather than a concrete implementation, the application can seamlessly switch between different file systems without changing any of the UI component code.

### `in-memory-file-system.service.ts`

-   **Purpose:** An implementation of `FileSystemProvider` that creates a complete, writable virtual file system that persists in the browser's `localStorage`.
-   **Role:** This service provides the default "Session" drive in the application. It manages a hierarchical tree of files and folders in an Angular Signal. All file operations (create, rename, delete, move, copy) are handled through robust, immutable update patterns, ensuring that the UI reacts reliably to every change. The entire file system state is serialized to JSON and saved to `localStorage`, so any changes made by the user are preserved between sessions.

### `remote-file-system.service.ts`

-   **Purpose:** An implementation of `FileSystemProvider` that communicates with a generic remote backend via the broker.
-   **Role:** This service is instantiated by the `AppComponent` when a user "mounts" a server profile. Crucially, if the mount is performed after a user login, it associates the connection with that user. It then uses the **user's username** as the `alias` for all backend file system requests, effectively creating a secure, sandboxed file system for each user. If no user is logged in for the profile (e.g., on an auto-connected profile), it falls back to using the profile's name as the alias.

## Intended Desktop Integration Services

These services were designed to bridge the Angular application with the Electron host for native file system access.

### `electron-desktop.service.ts`

-   **Purpose:** A low-level wrapper around the `window.desktopApi` object exposed by the `preload.js` script.
-   **Role:** This service directly translates method calls into `invoke` calls on the appropriate IPC channel. It is a direct, one-to-one mapping to the API exposed by the preload script, forming the communication layer between the web view and the Electron main process.

### `electron-file-system.service.ts`

-   **Purpose:** An implementation of the `FileSystemProvider` abstract class that uses `ElectronDesktopService` to interact with the user's local file system.
-   **Role:** This service acts as the adapter that allows the main `FileExplorerComponent` to work with the local file system without any modifications. When the application is running in Electron, this service would be provided as the `FileSystemProvider`, and all calls to `getContents`, `rename`, etc., would be transparently routed through the IPC bridge to the Node.js backend running in `main.js`.

## State Management Services

### `clipboard.service.ts`

-   **Purpose:** A stateful service that acts as a global, application-wide clipboard.
-   **State:** It holds a `signal` containing the `ClipboardPayload`, which includes the items being transferred, the source path, the source provider, and the operation type (`'cut'` or `'copy'`).
-   **Benefit:** Because it's a singleton service, any component can inject it to read from or write to the clipboard. This is what enables a user to "copy" a file in one file explorer pane and "paste" it in the other.

### `server-profile.service.ts`

-   **Purpose:** A stateful service for all CRUD (Create, Read, Update, Delete) operations related to `ServerProfile`s.
-   **State:** It holds signals for the list of all `profiles` and the `activeProfileId`. It uses a `computed` signal (`activeProfile`) to derive the full active profile object.
-   **Persistence:** It uses an `effect` to automatically save all profiles and the active ID to the browser's `localStorage` whenever they change, ensuring they persist between sessions.

## Search Services

This collection of services was intended to power the multi-faceted search pane.

### `google-search.service.ts`
-   **Purpose:** To fetch live web search results. It was designed to send a query to a backend proxy, which would then call the Google Custom Search API. It includes robust error handling to detect if the backend is not configured with the necessary API keys, allowing the UI to display a helpful message instead of failing.

### `unsplash.service.ts`
-   **Purpose:** To provide image search results. This is currently a mock service that returns a predefined set of images to simulate a real image search API.

### `gemini.service.ts`
-   **Purpose:** To provide generative AI responses. This service directly integrates with the `@google/genai` SDK to send prompts to the Gemini model. It requires a `process.env.API_KEY` to be configured in the execution environment.

### `youtube-search.service.ts` & `academic-search.service.ts`
-   **Purpose:** To provide video and academic search results, respectively. These are currently mock services that return hardcoded data to demonstrate the intended functionality of their corresponding tabs in the search pane.
