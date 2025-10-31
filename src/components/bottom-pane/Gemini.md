# "Idea Stream" Components Documentation

This document describes the suite of components that collectively create the "Idea Stream," the application's multi-faceted contextual content view. This feature is not a single component, but rather an integrated part of the `FileExplorerComponent`.

## Feature Overview

The "Idea Stream" is a resizable, collapsible pane at the bottom of the `FileExplorerComponent`. Its purpose is to provide users with dynamically fetched, relevant content related to their current context (e.g., the folder they are in). It displays an interleaved feed of mock data from various sources.

The stream's layout automatically adapts to the `FileExplorerComponent`'s main display mode:
- When the file explorer is in **Grid View**, the stream shows content as a grid of rich "Card" components.
- When the file explorer is in **List View**, the stream shows a more compact list of "List Item" components.

## Stream Result Components

These are a series of presentational components, each tailored to display a specific type of search result. They all follow the same pattern: they receive an object with the result data via an `input()` and emit a `NewBookmark` object via a `saveBookmark` `output()` when the user wants to save an item.

The components are organized into two subdirectories based on their visual style:

### `stream-cards`
Used for the grid view display.
-   **`web-result-card`**: Displays mock web search results with a title, link, and snippet.
-   **`image-result-card`**: Displays mock image results in a responsive grid.
-   **`gemini-result-card`**: Displays a formatted text block for a mock generative AI response.
-   **`youtube-result-card`**: Displays mock video results with thumbnails, titles, and descriptions.
-   **`academic-result-card`**: Displays mock academic paper results with titles, authors, and publication info.

### `stream-list-items`
Used for the list view display. This directory contains a list-item equivalent for each of the card components above, providing a more compact representation of the same data.