# `BottomPaneComponent` and Search Results Documentation

This directory contains the `BottomPaneComponent` and a suite of related components that collectively create the application's multi-faceted search results view.

## `BottomPaneComponent`

This is the main container component that appears at the bottom of the screen when a search is active.

### Core Responsibilities

1.  **Layout and Visibility:** It provides the main layout for the search results area and is conditionally rendered by the `AppComponent`.
2.  **Tab Management:** It uses the `TabControlComponent` to create tabs for different search sources (Files, Google, Images, etc.).
3.  **Content Projection:** It projects the various search result components (e.g., `WebSearchResultsComponent`, `ImageSearchResultsComponent`) into the appropriate tabs.
4.  **Event Aggregation:** It listens for events from its child components, such as `saveBookmark`, and propagates them up to the `AppComponent` for handling. It also provides the "Close" button to dismiss the search view.

## Search Result Components

These are a series of presentational components, each tailored to display a specific type of search result. They all follow a similar pattern: they receive an array of data via an `input()` and emit a `NewBookmark` object via an `output()` when the user wants to save an item.

-   **`search-results`**: Displays file system search results in a list, showing the file name and its path.
-   **`web-search-results`**: Displays mock web search results with a title, link, and snippet.
-   **`image-search-results`**: Displays mock image results in a responsive grid.
-   **`gemini-search-results`**: Displays a formatted text block for a mock generative AI response.
-   **`youtube-search-results`**: Displays mock video results with thumbnails, titles, and descriptions.
-   **`academic-search-results`**: Displays mock academic paper results with titles, authors, and publication info.
