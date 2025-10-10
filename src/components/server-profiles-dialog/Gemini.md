# `ServerProfilesDialogComponent` Documentation (`/src/components/server-profiles-dialog/Gemini.md`)

This component is a modal dialog that provides a full user interface for managing remote server connection profiles.

## Core Responsibilities

1.  **CRUD Operations:** It allows users to Create, Read, Update, and Delete server profiles.
2.  **State Persistence:** It does not manage the state itself but acts as a view layer for the `ServerProfileService`. All changes made in the dialog (save, delete, set active) are immediately sent to the service, which is responsible for persisting them to `localStorage`.
3.  **UI State Management:** It manages the state of the dialog's UI, such as which profile is currently selected for editing and the content of the form fields.
4.  **Activating Connections:** When a user sets a profile as active, it emits an event to notify the parent `AppComponent` to initiate the switch to a remote connection.

## API and Data Flow

### Inputs (`input()`)

-   None. It gets all its data directly from the injected `ServerProfileService`.

### Outputs (`output()`)

-   `close: void`: Emitted when the user clicks the close button or the background overlay, signaling the parent to close the dialog.
-   `profileActivated: void`: Emitted when the "Set Active" button is clicked. This is the trigger for the `AppComponent` to switch its `connectionState` to `'remote'`.

### Interactions

-   **`ServerProfileService`:** This is the component's primary dependency. It reads the list of profiles from `profileService.profiles()` and calls methods like `updateProfile()`, `addProfile()`, and `deleteProfile()` to enact changes.

## Internal State (Signals)

-   `selectedProfileId: string | null`: Keeps track of which profile in the left-hand list is currently selected.
-   `formState: FormState | null`: Holds the data for the profile currently being edited or created. When a user clicks "New Profile" or selects an existing one, this signal is populated, and the form in the right-hand panel is displayed. When `null`, a placeholder message is shown.
