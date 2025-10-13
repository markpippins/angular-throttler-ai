# `src` Directory Documentation (`/src/Gemini.md`)

This directory contains the root component of the Angular application.

## `AppComponent` - The Application Orchestrator

The `AppComponent` is the top-level component that acts as the central controller and state manager for the entire user interface. It is responsible for creating a unified experience that combines multiple different file system backends.

### Core Responsibilities

1.  **State Management:** It holds and manages the primary application state using **Angular Signals**. Key state signals include:
    -   `isSplitView`: A boolean that controls whether one or two file explorer panes are visible.
    -   `activePaneId`: Determines which of the two panes is currently active and should receive keyboard focus or sidebar navigation events.
    -   `folderTree`: Holds the combined, virtual directory structure, which is passed to the sidebar's tree view.
    -   `panePaths`: An array that holds the current path for each active file explorer pane. This is the single source of truth for pane locations.

2.  **Multi-Root File System Orchestration:** This is the key architectural feature of the component.
    -   On startup, it calls the `loadFolderTree()` method, which fetches the root folders from both the `ElectronFileSystemService` (local files) and the `ConvexDesktopService` (remote data).
    -   It then constructs a virtual "Home" folder that contains the two roots as its children: "Local Filesystem" and "Convex Pins".
    -   This virtual tree is passed to the sidebar, allowing the user to seamlessly navigate between completely different data sources as if they were part of a single file system.

3.  **Per-Pane Dynamic File System Provider:**
    -   The component injects both `ElectronFileSystemService` and `ConvexDesktopService`.
    -   It uses two `computed` signals, `pane1Provider` and `pane2Provider`, to dynamically assign the correct file system service to each file explorer pane.
    -   The provider for a pane is determined reactively based on its *current path*. If a pane's path starts with "Convex Pins", it gets the `ConvexDesktopService`; otherwise, it gets the `ElectronFileSystemService`.
    -   This design makes the `FileExplorerComponent` completely agnostic about its data source; it simply interacts with the `FileSystemProvider` interface it is given, and the `AppComponent` ensures it's always the correct one.

4.  **Component Coordination:**
    -   The `app.component.html` template defines the main layout and binds the file explorer panes to their respective path and provider signals.
    -   It orchestrates the interactions between the `SidebarComponent` and the `FileExplorerComponent`(s). For example, when a user clicks a folder in the sidebar, `onSidebarNavigation()` updates the path for the *active* pane, which in turn causes that pane to reactively update its contents and potentially even its underlying provider.

### API and Interactions

-   **Inputs:** None (as it's the root component).
-   **Outputs:** None.
-   **Methods:**
    -   `loadFolderTree()`: An async method that builds the combined virtual folder tree from the local and Convex sources.
    -   `toggleSplitView()`: Manages the `isSplitView` state and the paths for each pane.
    -   `onPane1PathChanged()` / `onPane2PathChanged()`: Event handlers that keep the parent component's record of each pane's path (`panePaths` signal) in sync when the user navigates within a file explorer.
    -   `executeSearch()`: A context-aware search method that delegates the search to the correct provider based on the active pane's current path.