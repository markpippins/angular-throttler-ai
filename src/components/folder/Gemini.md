# `FolderComponent` Documentation (`/src/components/folder/Gemini.md`)

This component is responsible for rendering a single folder item within the main content area of the `FileExplorerComponent`.

## Core Responsibilities

1.  **Visual Representation:** It displays the folder icon and name. It has distinct visual states for being selected or being hovered over.
2.  **Drag-and-Drop Target:** It acts as a drop zone. When a user drags files from their operating system and drops them directly onto the folder icon, this component captures the event.
3.  **Event Delegation:** It does not contain any business logic itself. Instead, it emits events for user interactions (like context menu clicks or file drops) to its parent, the `FileExplorerComponent`, which then handles the actual logic.

## API and Data Flow

### Inputs (`input()`)

-   `item: FileSystemNode`: The data object for the folder to be rendered.
-   `iconUrl: string | null`: The URL for a custom icon, if available.
-   `isSelected: boolean`: Determines if the folder should be rendered with a "selected" style.
-   `hasFailedToLoadImage: boolean`: A flag, typically managed by the parent, that indicates a previous attempt to load `iconUrl` failed. This is used to prevent repeated failed network requests and immediately show the fallback icon.

### Outputs (`output()`)

-   `itemContextMenu: { event: MouseEvent; item: FileSystemNode }`: Emitted when the user right-clicks on the folder.
-   `itemDrop: { files: FileList; item: FileSystemNode }`: Emitted when files are successfully dropped onto the folder. This payload includes the dropped files and the folder item itself, so the parent knows where to upload them.
-   `imageError: string`: Emitted when the browser fails to load the image from the provided `iconUrl`. The payload is the name of the item that failed, allowing the parent to track failed URLs.

### Internal State (Signals)

-   `isDragOver: boolean`: A local signal that becomes `true` when a file is being dragged over the component. This is used to apply a distinct visual style (e.g., a highlighted background) to give the user clear feedback that this is a valid drop target.