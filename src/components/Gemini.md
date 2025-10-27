# `components` Directory Documentation (`/src/components/Gemini.md`)

This directory is the heart of the application's UI, containing all the reusable, standalone Angular components that construct the user interface.

## Architectural Approach

- **Modularity:** Each sub-folder represents a distinct component with a single responsibility (e.g., `toolbar`, `sidebar`, `file-explorer`).
- **Standalone Components:** All components are built using Angular's standalone API, eliminating the need for NgModules and promoting a more streamlined, component-focused architecture.
- **OnPush Change Detection:** Every component uses `changeDetection: ChangeDetectionStrategy.OnPush`. This is a performance best practice that tells Angular a component's view only needs to be updated if its inputs change, an event handler is fired from its template, or a signal it uses is updated.
- **Signal-Based:** Components heavily leverage Angular Signals for managing their internal state, making them highly reactive and efficient.
- **Clear APIs:** Components communicate with each other via well-defined `input()` properties for data flowing in and `output()` properties for events flowing out. This makes the data flow predictable and easy to trace.

---
## Core UI Components

### `file-explorer`
The main component for displaying and interacting with files and folders in a single pane. See its dedicated `Gemini.md` for details.

### `sidebar`
The collapsible and resizable left-hand panel containing the folder tree view and other tabs. See its dedicated `Gemini.md` for details.

### `toolbar`
The row of action buttons (New, Cut, Copy, etc.) that sits above the file explorer pane.

### `detail-pane`
A slide-out pane on the right side that was intended to show detailed properties for a selected file and a list of saved bookmarks relevant to the current folder.

## Search Functionality Components

This suite of components was designed to provide a comprehensive, multi-source search experience.

### `search-dialog`
A modal dialog that serves as the main entry point for a detailed search. It allows the user to enter a query and select which "engines" (Files, Web, Images, etc.) to search across.

### `bottom-pane`
A large, tabbed container at the bottom of the screen that appears when a search is initiated. It hosts the results from the various search engines, each in its own tab.

### `search-results`
A generic component used in the "File" tab of the bottom pane to display a list of file search results in a table.

### `web-search-results`
A component inside the "Web" tab of the bottom pane. It was designed to take a query, call the `GoogleSearchService`, and display a list of web page results.

### `image-search-results`
A component inside the "Image" tab. It takes a query, calls the `UnsplashService`, and displays a grid of image results.

### `gemini-search-results`
A component inside the "Gemini" tab. It provides a textarea for submitting a prompt to the `GeminiService` and displays the generative AI response.

### `youtube-search-results` & `academic-search-results`
Similar to the other search components, these were designed to display mock results for video and academic searches, respectively.
