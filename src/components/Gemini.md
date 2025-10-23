# `components` Directory Documentation (`/src/components/Gemini.md`)

This directory is the heart of the application's UI, containing all the reusable, standalone Angular components that construct the user interface.

## Architectural Approach

- **Modularity:** Each sub-folder represents a distinct component with a single responsibility (e.g., `toolbar`, `sidebar`, `file-explorer`).
- **Standalone Components:** All components are built using Angular's standalone API, eliminating the need for NgModules and promoting a more streamlined, component-focused architecture.
- **OnPush Change Detection:** Every component uses `changeDetection: ChangeDetectionStrategy.OnPush`. This is a performance best practice that tells Angular a component's view only needs to be updated if its inputs change, an event handler is fired from its template, or a signal it uses is updated.
- **Signal-Based:** Components heavily leverage Angular Signals for managing their internal state, making them highly reactive and efficient.
- **Clear APIs:** Components communicate with each other via well-defined `input()` properties for data flowing in and `output()` properties for events flowing out. This makes the data flow predictable and easy to trace.
