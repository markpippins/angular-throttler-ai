# `TreeNodeComponent` Documentation (`/src/components/tree-node/Gemini.md`)

This component is the fundamental building block of the `TreeViewComponent`. It's a **recursive component** designed to render a single folder in the tree and, if expanded, to render its own children using instances of itself.

## Core Responsibilities

1.  **Rendering a Node:** It displays the folder icon, name, and an expand/collapse toggle button. The indentation of the node is controlled by its `level` input.
2.  **Managing Expanded State:** It maintains its own `isExpanded` signal. Clicking the toggle button updates this signal.
3.  **Recursion:** When `isExpanded()` is true, the component's template (`tree-node.component.html`) uses an `@for` block to iterate over the node's children and renders a new `<app-tree-node>` for each child, passing the appropriate `level` and `path`.
4.  **Path Management:** It emits a `pathChange` event when its main body is clicked, signaling a navigation request. It also listens for `pathChange` events from its children and bubbles them up the component tree.
5.  **Auto-Expansion:** It uses an `effect` to automatically expand itself if the `currentPath` (the path of the item selected in the main explorer view) is a descendant of this node's path. This ensures the tree view stays in sync with the main view.

## API and Data Flow

### Inputs (`input()`)

-   `node: FileSystemNode`: The data for the folder this component instance represents.
-   `path: string[]`: The full path to this node from the root.
-   `currentPath: string[]`: The path of the currently viewed folder in the main file explorer, used for highlighting and auto-expanding.
-   `level: number`: The depth of the node in the tree, used to calculate indentation.

### Outputs (`output()`)

-   `pathChange: string[]`: Emitted when this node or one of its descendants is selected by the user.
