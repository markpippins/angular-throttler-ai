# `lib` Directory Documentation (`/lib/Gemini.md`)

This directory contains legacy client-side scripts. These files represent an older, non-Angular approach to interacting with the application's backend services.

## Files and Purpose

### `broker-client.js`

-   This is the original, plain JavaScript implementation of a client for the message broker. It uses the `fetch` API to POST requests to a hardcoded broker URL. It has been functionally replaced by the `BrokerService` located in `/src/services/broker.service.ts`.

### `fs-client.js`

-   This file, which is currently empty, historically contained functions that used the `broker-client` to make specific file system requests. Its functionality has been replaced by the `FsService` in `/src/services/fs.service.ts`.

## Architectural Significance

These files are important for understanding the application's evolution. The migration from these global, function-based scripts to the injectable, TypeScript-based services in the `src/services` directory represents a significant architectural improvement, bringing benefits like type safety, dependency injection, and better testability.

**Note:** These files are not actively used by the modern Angular application and are kept primarily for historical reference.
