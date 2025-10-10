# `TreeViewComponent` Documentation (`/src/components/tree-view/Gemini.md`)

This component serves as the root container for the folder navigation tree displayed in the sidebar.

## Core Responsibilities

1.  **Initiating the Tree:** It receives the `rootNode` of the file system structure.
2.  **Rendering the First Level:** Its template iterates over the *children* of the `rootNode` and renders the first level of `TreeNodeComponent`s.
3.  **Event Propagation:** It listens for `pathChange` events emitted by the `TreeNodeComponent`s and propagates them up to its parent, the `SidebarComponent`.

## API and Data Flow

### Inputs (`input()`)

-   `rootNode: FileSystemNode`: The complete, hierarchical folder structure.
-   `currentPath: string[]`: The path of the folder currently being viewed in the `FileExplorerComponent`. This is passed down through the tree to allow the correct node to be highlighted.

### Outputs (`output()`)

-   `pathChange: string[]`: Emits the full path of a folder when a user clicks on it within the tree.
