# `BottomPaneComponent` Documentation (`/src/components/bottom-pane/Gemini.md`)

This component was designed to be the central hub for the application's powerful, multi-faceted search functionality. It is a large, resizable pane that appears at the bottom of the window when a search is initiated.

## Core Responsibilities

1.  **Tabbed Interface:** Its primary feature is a tab control that separates search results from different sources. The intended tabs were:
    -   **File:** For results from the currently active file system.
    -   **Web:** For results from a Google Search.
    -   **Image:** For results from an image search service.
    -   **Gemini:** For generative AI responses.
    -   **YouTube:** For video search results.
    -   **Academic:** For scholarly article search results.

2.  **Receiving External Search Queries:** The component is designed to be controlled by its parent, the `AppComponent`. When a user performs a search from the main `SearchDialogComponent`, the `AppComponent` passes the query down to this component via multiple input signals (e.g., `webSearchQuery`, `imageSearchQuery`). A change to one of these inputs would trigger the corresponding child component (e.g., `WebSearchResultsComponent`) to perform its search.

3.  **Hosting Result Components:** Each tab in the `BottomPaneComponent` contains a specialized child component responsible for handling one type of search (e.g., `<app-web-search-results>`, `<app-image-search-results>`). The `BottomPaneComponent` acts as a container, passing the relevant query and context (like the `ImageService`) to these children.

4.  **Internal File Search:** In addition to receiving external queries, the "File" tab was designed with its own search bar. This would allow a user to perform subsequent file searches directly within the pane without having to reopen the main search dialog.

5.  **Bookmark Aggregation:** It was designed to be an event hub for saving search results. Each child result component has a "Save" button. When clicked, they emit a `(save)` event with a `NewBookmark` payload. The `BottomPaneComponent` catches these events and bubbles them up to the `AppComponent` via its own `(saveBookmark)` output.

## API and Data Flow

### Inputs (`input()`)

-   `webSearchQuery`, `imageSearchQuery`, etc.: These signals receive a query string from the parent when a new search is started.
-   `fileSearchResults: SearchResultNode[] | null`: Receives the results of a file search initiated from the main dialog.
-   `imageService: ImageService`: The image service for the active pane, passed down to the `SearchResultsComponent` to resolve icons.
-   `activeProvider: FileSystemProvider`: The file system provider for the active pane, used for performing internal file searches.
-   `initialTabRequest`: An object that tells the pane which tab to select when it first becomes visible.

### Outputs (`output()`)

-   `saveBookmark: NewBookmark`: Emits a new bookmark object when a user saves any search result from any tab.
