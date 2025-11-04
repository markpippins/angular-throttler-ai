import { Injectable, signal, effect, computed } from '@angular/core';

const PREFERENCES_STORAGE_KEY = 'file-explorer-ui-preferences';

export interface UiPreferences {
  isSidebarVisible: boolean;
  isChatVisible: boolean;
  isDetailPaneOpen: boolean;
  isSavedItemsVisible: boolean;
  isRssFeedVisible: boolean;
  isStreamVisible: boolean;
}

const DEFAULT_PREFERENCES: UiPreferences = {
  isSidebarVisible: true,
  isChatVisible: true,
  isDetailPaneOpen: true,
  isSavedItemsVisible: true,
  isRssFeedVisible: true,
  isStreamVisible: true,
};

@Injectable({
  providedIn: 'root',
})
export class UiPreferencesService {
  private preferences = signal<UiPreferences>(DEFAULT_PREFERENCES);

  // Public readonly signals for consumers
  public readonly isSidebarVisible = computed(() => this.preferences().isSidebarVisible);
  public readonly isChatVisible = computed(() => this.preferences().isChatVisible);
  public readonly isDetailPaneOpen = computed(() => this.preferences().isDetailPaneOpen);
  public readonly isSavedItemsVisible = computed(() => this.preferences().isSavedItemsVisible);
  public readonly isRssFeedVisible = computed(() => this.preferences().isRssFeedVisible);
  public readonly isStreamVisible = computed(() => this.preferences().isStreamVisible);

  constructor() {
    this.loadPreferences();
    effect(() => {
      this.savePreferences();
    });
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Basic validation to merge with defaults, preventing crashes if new keys are added
        const mergedPreferences = { ...DEFAULT_PREFERENCES, ...parsed };
        this.preferences.set(mergedPreferences);
        return;
      }
    } catch (e) {
      console.error('Failed to load UI preferences from localStorage', e);
    }
    // Set default if loading fails or nothing is stored
    this.preferences.set(DEFAULT_PREFERENCES);
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(this.preferences()));
    } catch (e) {
      console.error('Failed to save UI preferences to localStorage', e);
    }
  }

  // Public methods to toggle state
  toggleSidebar(): void {
    this.preferences.update(p => ({ ...p, isSidebarVisible: !p.isSidebarVisible }));
  }

  toggleChat(): void {
    this.preferences.update(p => ({ ...p, isChatVisible: !p.isChatVisible }));
  }

  toggleDetailPane(): void {
    this.preferences.update(p => ({ ...p, isDetailPaneOpen: !p.isDetailPaneOpen }));
  }

  toggleSavedItems(): void {
    this.preferences.update(p => ({ ...p, isSavedItemsVisible: !p.isSavedItemsVisible }));
  }

  toggleRssFeed(): void {
    this.preferences.update(p => ({ ...p, isRssFeedVisible: !p.isRssFeedVisible }));
  }
  
  toggleStream(): void {
    this.preferences.update(p => ({ ...p, isStreamVisible: !p.isStreamVisible }));
  }
}
