# `src` Directory Documentation (`/src/Gemini.md`)

This directory contains the root component of the Angular application.

## `AppComponent` - The Application Orchestrator

The `AppComponent` is the top-level component that acts as the central controller and state manager for the entire user interface.

### Core Responsibilities

1.  **State Management:** It holds and manages the primary application state using **Angular Signals**. Key state signals include:
    - `connectionState`: Tracks whether the app is in `'local'` or `'remote'` mode.
    - `isSplitView`: A boolean that controls whether one or two file explorer panes are visible.
    - `activePaneId`: Determines which of the two panes is currently active and should receive keyboard focus or sidebar navigation events.
    - `folderTree`: Holds the entire directory structure for the current connection, which is passed to the sidebar's tree view.

2.  **Dynamic File System Provider:** This is a critical architectural feature of the component.
    - It injects both `ElectronFileSystemService` (for local files) and `RemoteFileSystemService` (for remote files).
    - A `computed` signal, `fileSystemProvider`, reactively selects the correct service based on the `connectionState()` signal.
    - This computed signal is then passed as an `[input]` to the child `FileExplorerComponent`(s). This makes the file explorer components completely agnostic about the underlying data source; they simply interact with the `FileSystemProvider` interface they are given.

3.  **Layout and Component Coordination:**
    - The `app.component.html` template defines the main layout, including the header, sidebar, and the container for the file explorer panes.
    - It orchestrates the interactions between the `SidebarComponent` and the `FileExplorerComponent`(s). For example, when a user clicks a folder in the sidebar, the `AppComponent` catches the event and passes a `sidebarNavigationEvent` signal down to the *active* file explorer pane, telling it to navigate to the new path.
    - It manages the lifecycle of the file explorer panes, adding or removing the second pane when `toggleSplitView()` is called.

### API and Interactions

- **Inputs:** None (as it's the root component).
- **Outputs:** None.
- **Methods:**
    - `loadFolderTree()`: An async method to fetch the folder structure using the currently active provider. It's called automatically by an `effect` whenever the connection changes.
    - `toggleConnection()` / `disconnect()` / `switchToRemote()`: Methods that manage the `connectionState` and open the server profiles dialog.
    - `toggleSplitView()`: Manages the `isSplitView` state and the paths for each pane.
    - `onPanePathChanged()`: An event handler that keeps the parent component's record of each pane's path (`panePaths` signal) in sync.
