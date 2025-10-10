# `src/lib` Directory Documentation (`/src/lib/Gemini.md`)

This directory is a remnant of a previous architectural approach and is now considered **deprecated**.

## Historical Context

The files that once existed here (`broker-client.ts`, `fs-client.ts`, etc.) were early versions of the API client libraries. They were typically implemented as collections of exported functions.

## Current Status

This approach has been superseded by the injectable, singleton services located in the `/src/services` directory. The service-based architecture offers several advantages:

-   **Dependency Injection:** Services can be easily injected into components, making them more modular and testable.
-   **State Management:** Services can manage state that needs to be shared across different parts of the application (e.g., `ServerProfileService` managing the active profile).
-   **Lifecycle Management:** Angular manages the lifecycle of services.

This directory is empty and should not be used for any new development.
