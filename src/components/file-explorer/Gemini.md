# `FileExplorerComponent` Documentation (`/src/components/file-explorer/Gemini.md`)

The `FileExplorerComponent` is the most complex and central UI component in the application. It provides the main view for navigating and interacting with a file system.

## Core Responsibilities

1.  **Displaying Directory Contents:** It fetches and displays the list of files and folders for the `currentPath` using the provided `fileSystemProvider`.
2.  **State Management:** It manages a local `state` signal to track the status of data loading (`'loading'`, `'success'`, `'error'`).
3.  **User Interaction & Selection:** It handles all user input for selecting items:
    - Single click
    - Ctrl/Meta + click for multi-selection
    - Shift + click for range selection
    - Click-and-drag "lasso" selection in the main content area.
    - It maintains the set of selected items in the `selectedItems` signal.
4.  **Navigation:** It allows users to navigate the file system by double-clicking folders, using the "Up" button, or clicking on segments in the address bar.
5.  **File Operations:** It orchestrates all file manipulation operations by calling methods on its `fileSystemProvider`. This includes creating, renaming, and deleting items.
6.  **Clipboard Integration:** It uses the shared `ClipboardService` to perform cut, copy, and paste operations. This allows it to share clipboard data with other `FileExplorerComponent` instances.
7.  **Drag and Drop:** It supports dragging files from the user's native OS and dropping them into the main area or onto a folder to trigger an upload.

## API and Data Flow

### Inputs (`input()`)

-   `id: number`: A unique identifier (1 or 2), crucial for multi-pane management.
-   `isActive: boolean`: Indicates if this pane is the currently active one. Active panes are highlighted and respond to sidebar navigation.
-   `isSplitView: boolean`: Affects styling and layout.
-   `sidebarNavigationEvent: { path: string[], timestamp: number } | null`: A trigger signal from the parent. An `effect` watches this input and navigates the component to the new path if it's the active pane.
-   `fileSystemProvider: FileSystemProvider`: **This is the most important input.** It's the abstraction the component uses for all file system operations. It makes the component entirely independent of the data source (local vs. remote).

### Outputs (`output()`)

-   `activated: number`: Emits its `id` when the component's main area is clicked, telling the parent `AppComponent` to set it as the active pane.
-   `pathChanged: {id: number, path: string[]}`: Emits an event whenever the `currentPath` signal changes, keeping the parent `AppComponent` informed of its location.

## Internal State (Signals)

-   `currentPath`: An array of strings representing the current directory path (e.g., `['Documents', 'Work']`).
-   `state`: An object tracking the loading status and the list of `items` in the current directory.
-   `selectedItems`: A `Set<string>` containing the names of the selected items.
-   `contextMenu`: Holds the coordinates and target item for rendering the right-click context menu.
-   `isLassoing` / `lassoRect`: Signals that manage the state and position of the selection rectangle.
-   `sortCriteria`: Stores the current sorting key and direction.

## Template (`file-explorer.component.html`)

-   **Layout:** A flexbox column containing the header/address bar, the `app-toolbar`, the main content grid, and a status bar.
-   **Conditional Rendering:** Uses `@switch` to display a loading spinner, an error message, or the list of files based on the `state().status`.
-   **Item Rendering:** Uses `@for` to loop through the `sortedItems()` computed signal. It renders an `<app-folder>` for directories and a generic `<div>` for files.
-   **Event Bindings:** The template is rich with event bindings (`(click)`, `(dblclick)`, `(contextmenu)`, `(dragover)`, `(drop)`) that call the component's methods to handle user interactions.
-   **Lasso:** A `<div>` for the lasso rectangle is conditionally rendered and positioned based on the `lassoRect` signal.
