# `SidebarComponent` Documentation (`/src/components/sidebar/Gemini.md`)

The `SidebarComponent` is a stateful container component that forms the collapsible and resizable left-hand panel of the application.

## Core Responsibilities

1.  **Layout and Structure:** It provides the main structure for the sidebar, containing a tabbed interface for different views (`Explorer`, `News`).
2.  **Collapsibility:** It manages its own collapsed/expanded state. When collapsed, it displays a minimal `VerticalToolbarComponent`. When expanded, it shows the full tabbed interface.
3.  **Resizability:** When expanded, it features a handle that allows the user to click and drag to resize its width. It manages the resize logic and updates its own width.
4.  **Navigation Hub:** Its primary role in the "Explorer" tab is to host the `TreeViewComponent`. It acts as an intermediary, receiving path change events from the tree view and emitting them up to the `AppComponent`.

## API and Data Flow

### Inputs (`input()`)

-   `folderTree: FileSystemNode | null`: The hierarchical data structure of all folders, which is passed down to the `TreeViewComponent` for rendering.
-   `currentPath: string[]`: The currently active path in the file explorer. This is passed down to the `TreeViewComponent` so it can highlight the corresponding node in the tree.

### Outputs (`output()`)

-   `pathChange: string[]`: Emitted when a user clicks on a node in the `TreeViewComponent`. The event bubbles up through this component to the parent `AppComponent`, which then instructs the active file explorer to navigate to this path.

## Internal State (Signals)

-   `isCollapsed: boolean`: Controls the collapsed/expanded state.
-   `width: number`: Stores the current width of the sidebar in pixels. This is bound to the element's style.
-   `isResizing: boolean`: A flag that is `true` while the user is actively dragging the resize handle. This is used to optimize rendering performance by, for example, disabling CSS transitions during the resize operation.