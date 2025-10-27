# `SearchDialogComponent` Documentation (`/src/components/search-dialog/Gemini.md`)

This component provides the modal dialog interface that was intended to be the primary entry point for initiating a detailed, multi-source search.

## Core Responsibilities

1.  **User Input Collection:** It renders a simple form containing a main text input for the search query.

2.  **Search Engine Selection:** It displays a group of checkboxes, allowing the user to select which "engines" they want to target with their query. The available engines were intended to be:
    -   Files (searching the current directory)
    -   Web (Google Search)
    -   Image (Unsplash Search)
    -   Gemini (AI Prompt)
    -   YouTube (Video Search)
    -   Academic (Scholarly Article Search)

3.  **Event Emission:** When the user clicks the "Search" button, the component's sole responsibility is to package the user's input into a single object and emit it. It does not perform any search logic itself.

## API and Data Flow

### Inputs (`input()`)

-   None.

### Outputs (`output()`)

-   `close: void`: Emitted when the user clicks the "Cancel" button or clicks outside the dialog.
-   `search: { query: string; engines: SearchEngines }`: This is the component's main output. It emits an object containing the text query and a boolean map of the selected search engines (e.g., `{ files: true, web: true, image: false, ... }`). This event is caught by the parent `AppComponent`, which then orchestrates the actual search operations.
