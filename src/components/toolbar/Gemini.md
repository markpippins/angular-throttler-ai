# `ToolbarComponent` Documentation (`/src/components/toolbar/Gemini.md`)

The `ToolbarComponent` is a presentational or "dumb" component that renders the row of action buttons (New, Cut, Copy, etc.) displayed within the `FileExplorerComponent`.

## Core Responsibilities

1.  **Displaying Controls:** It renders all the buttons, icons, and dropdowns for file operations, sorting, and uploading.
2.  **Delegating Actions:** It contains no business logic. When a user clicks a button, it simply emits a corresponding event to notify its parent component.
3.  **Reflecting State:** It dynamically enables or disables its buttons based on boolean inputs provided by the parent. This ensures that actions like "Delete" or "Rename" are only available when appropriate (e.g., when items are selected).

## API and Data Flow

This component is a clear example of unidirectional data flow. Data flows **in** via inputs, and events flow **out** via outputs.

### Inputs (`input()`)

-   `canCut: boolean`
-   `canCopy: boolean`
-   `canPaste: boolean`
-   `canRename: boolean`
-   `canShare: boolean`
-   `canDelete: boolean`
-   `currentSort: SortCriteria`: Used to display a checkmark next to the currently active sorting option in the sort dropdown.

### Outputs (`output()`)

-   `newFolderClick: void`
-   `newFileClick: void`
-   `filesUploaded: FileList`
-   `cutClick: void`
-   `copyClick: void`
-   `pasteClick: void`
-   `renameClick: void`
-   `shareClick: void`
-   `deleteClick: void`
-   `sortChange: SortCriteria`: Emits the new sorting key and direction when an option is selected.
