import { Injectable, signal, computed, effect } from '@angular/core';
import { ServerProfile } from '../models/server-profile.model';

const PROFILES_STORAGE_KEY = 'file-explorer-server-profiles';
const ACTIVE_PROFILE_ID_STORAGE_KEY = 'file-explorer-active-profile-id';

const DEFAULT_PROFILES: ServerProfile[] = [
  {
    id: 'default-local',
    name: 'Local (Debug)',
    brokerUrl: 'http://localhost:8080',
    imageUrl: 'http://localhost:8081',
  },
];

@Injectable({
  providedIn: 'root',
})
export class ServerProfileService {
  profiles = signal<ServerProfile[]>([]);
  activeProfileId = signal<string | null>(null);

  activeProfile = computed<ServerProfile | null>(() => {
    const profiles = this.profiles();
    const activeId = this.activeProfileId();
    if (!activeId) return null;
    return profiles.find(p => p.id === activeId) ?? null;
  });

  activeConfig = computed<{ brokerUrl: string, imageUrl: string }>(() => {
    const active = this.activeProfile();
    if (active) {
      return { brokerUrl: active.brokerUrl, imageUrl: active.imageUrl };
    }
    // Fallback to default if no active profile is found (should not happen after init)
    return { 
      brokerUrl: DEFAULT_PROFILES[0].brokerUrl, 
      imageUrl: DEFAULT_PROFILES[0].imageUrl 
    };
  });

  constructor() {
    this.loadProfiles();
    effect(() => {
      // Persist changes to profiles or active profile ID
      this.saveProfiles();
    });
  }

  private loadProfiles(): void {
    try {
      const profilesJson = localStorage.getItem(PROFILES_STORAGE_KEY);
      const storedProfiles = profilesJson ? JSON.parse(profilesJson) : [];
      
      if (storedProfiles.length > 0) {
        this.profiles.set(storedProfiles);
      } else {
        this.profiles.set(DEFAULT_PROFILES);
      }

      const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_STORAGE_KEY);
      if (activeId && this.profiles().some(p => p.id === activeId)) {
        this.activeProfileId.set(activeId);
      } else {
        // Set first profile as active if none is set or the stored one is invalid
        this.activeProfileId.set(this.profiles()[0]?.id ?? null);
      }
    } catch (e) {
      console.error('Failed to load profiles from localStorage', e);
      this.profiles.set(DEFAULT_PROFILES);
      this.activeProfileId.set(DEFAULT_PROFILES[0].id);
    }
  }

  private saveProfiles(): void {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(this.profiles()));
      const activeId = this.activeProfileId();
      if (activeId) {
        localStorage.setItem(ACTIVE_PROFILE_ID_STORAGE_KEY, activeId);
      } else {
        localStorage.removeItem(ACTIVE_PROFILE_ID_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save profiles to localStorage', e);
    }
  }

  private generateId(): string {
    return `profile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  addProfile(profileData: Omit<ServerProfile, 'id'>): void {
    const newProfile: ServerProfile = { ...profileData, id: this.generateId() };
    this.profiles.update(profiles => [...profiles, newProfile]);
  }

  updateProfile(updatedProfile: ServerProfile): void {
    this.profiles.update(profiles => 
      profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p)
    );
  }

  deleteProfile(id: string): void {
    this.profiles.update(profiles => profiles.filter(p => p.id !== id));
    if (this.activeProfileId() === id) {
      // If the active profile was deleted, set the first one as active
      this.activeProfileId.set(this.profiles()[0]?.id ?? null);
    }
  }

  setActiveProfile(id: string): void {
    if (this.profiles().some(p => p.id === id)) {
      this.activeProfileId.set(id);
    }
  }
}