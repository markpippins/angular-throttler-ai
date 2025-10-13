import { Component, ChangeDetectionStrategy, output, inject, signal, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerProfileService } from '../../services/server-profile.service';
import { ServerProfile } from '../../models/server-profile.model';

type FormState = {
  id: string | null;
  name: string;
  brokerUrl: string;
  imageUrl: string;
}

@Component({
  selector: 'app-server-profiles-dialog',
  template: `
<div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" (click)="close.emit()">
  <div class="bg-[rgb(var(--color-surface-dialog))] rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col" (click)="$event.stopPropagation()">
    
    <div class="p-4 border-b border-[rgb(var(--color-border-base))] flex justify-between items-center flex-shrink-0">
      <h3 class="text-lg font-semibold text-[rgb(var(--color-text-base))]">Server Connection Profiles</h3>
      <button (click)="close.emit()" class="p-1 rounded-full hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-muted))]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Profile List -->
      <div class="w-1/3 border-r border-[rgb(var(--color-border-base))] flex flex-col">
        <div class="p-2">
            <button (click)="startAddNew()" class="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-[rgb(var(--color-accent-solid-bg))] text-[rgb(var(--color-text-inverted))] hover:bg-[rgb(var(--color-accent-solid-bg-hover))] rounded-md shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-accent-ring))]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              <span>New Profile</span>
            </button>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          @for(profile of profileService.profiles(); track profile.id) {
            <div (click)="startEdit(profile)"
                 class="p-3 rounded-md cursor-pointer group"
                 [class.bg-[rgb(var(--color-accent-bg))]]="selectedProfileId() === profile.id"
                 [class.hover:bg-[rgb(var(--color-surface-hover-subtle))]]="selectedProfileId() !== profile.id">
              <div class="flex justify-between items-center">
                <span class="font-semibold text-[rgb(var(--color-text-base))] truncate">{{ profile.name }}</span>
                <div class="flex items-center space-x-2">
                  @if(mountedProfileIds().includes(profile.id)) {
                    <span class="text-xs font-bold text-[rgb(var(--color-status-blue-text))] bg-[rgb(var(--color-status-blue-bg))] px-2 py-0.5 rounded-full">MOUNTED</span>
                  }
                  @if(profileService.activeProfileId() === profile.id) {
                    <span class="text-xs font-bold text-[rgb(var(--color-status-green-text))] bg-[rgb(var(--color-status-green-bg))] px-2 py-0.5 rounded-full">ACTIVE</span>
                  }
                </div>
              </div>
              <p class="text-xs text-[rgb(var(--color-text-subtle))] truncate mt-1">{{ profile.brokerUrl }}</p>
            </div>
          }
        </div>
      </div>
      
      <!-- Right: Form/Details -->
      <div class="w-2/3 p-6 overflow-y-auto">
        @if (formState(); as form) {
          <div class="space-y-6">
            <h4 class="text-xl font-bold text-[rgb(var(--color-text-base))]">{{ form.id ? 'Edit Profile' : 'Create New Profile' }}</h4>
            
            <div>
              <label for="profileName" class="block text-sm font-medium text-[rgb(var(--color-text-muted))]">Profile Name</label>
              <input type="text" id="profileName" [value]="form.name" (input)="onFormValueChange($event, 'name')" placeholder="e.g., Production Environment"
                    class="mt-1 block w-full px-3 py-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border-muted))] rounded-md shadow-sm focus:outline-none focus:ring-[rgb(var(--color-accent-ring))] focus:border-[rgb(var(--color-accent-ring))] sm:text-sm">
            </div>

            <div>
              <label for="brokerUrl" class="block text-sm font-medium text-[rgb(var(--color-text-muted))]">Broker URL</label>
              <input type="text" id="brokerUrl" [value]="form.brokerUrl" (input)="onFormValueChange($event, 'brokerUrl')" placeholder="e.g., http://localhost:8080"
                    class="mt-1 block w-full px-3 py-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border-muted))] rounded-md shadow-sm focus:outline-none focus:ring-[rgb(var(--color-accent-ring))] focus:border-[rgb(var(--color-accent-ring))] sm:text-sm">
            </div>

            <div>
              <label for="imageUrl" class="block text-sm font-medium text-[rgb(var(--color-text-muted))]">Image Server URL</label>
              <input type="text" id="imageUrl" [value]="form.imageUrl" (input)="onFormValueChange($event, 'imageUrl')" placeholder="http://..."
                    class="mt-1 block w-full px-3 py-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border-muted))] rounded-md shadow-sm focus:outline-none focus:ring-[rgb(var(--color-accent-ring))] focus:border-[rgb(var(--color-accent-ring))] sm:text-sm">
            </div>
            
            <div class="pt-4 border-t border-[rgb(var(--color-border-base))] flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
              <div class="flex space-x-2">
                <button (click)="saveProfile()" class="px-4 py-2 bg-[rgb(var(--color-accent-solid-bg))] text-[rgb(var(--color-text-inverted))] rounded-md hover:bg-[rgb(var(--color-accent-solid-bg-hover))] transition-colors font-semibold text-sm disabled:bg-[rgb(var(--color-disabled-bg))]" [disabled]="!form.name.trim()">
                  Save Profile
                </button>
                <button (click)="cancelEdit()" class="px-4 py-2 bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-base))] rounded-md hover:bg-[rgb(var(--color-border-base))] transition-colors font-semibold text-sm">
                  Cancel
                </button>
              </div>

              @if (form.id && selectedProfile(); as profile) {
                <div class="flex space-x-2">
                    @if (mountedProfileIds().includes(profile.id)) {
                      <button (click)="toggleMount(profile)" class="px-4 py-2 border border-orange-500 text-orange-600 dark:text-orange-400 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors font-semibold text-sm">
                        Unmount
                      </button>
                    } @else {
                      <button (click)="toggleMount(profile)" class="px-4 py-2 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-semibold text-sm">
                        Mount
                      </button>
                    }
                    <button (click)="deleteProfile(form.id!)" class="p-2 text-[rgb(var(--color-text-subtle))] hover:bg-[rgb(var(--color-danger-bg-hover))] hover:text-[rgb(var(--color-danger-text))] rounded-md transition-colors" title="Delete Profile" [disabled]="profileService.profiles().length <= 1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="h-full flex flex-col items-center justify-center text-center text-[rgb(var(--color-text-subtle))]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3m0 0l3-3m-3 3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
            <p class="mt-4 text-lg">Select a profile to view or edit.</p>
            <p>Or, create a new profile to get started.</p>
          </div>
        }
      </div>
    </div>
  </div>
</div>
  `,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerProfilesDialogComponent {
  profileService = inject(ServerProfileService);
  
  mountedProfileIds = input<string[]>([]);
  close = output<void>();
  mountProfile = output<ServerProfile>();
  unmountProfile = output<ServerProfile>();

  selectedProfileId = signal<string | null>(null);
  
  // Form state for editing/creating
  formState = signal<FormState | null>(null);

  // Computed signal to find the full profile object when editing.
  selectedProfile = computed(() => {
    const form = this.formState();
    if (form && form.id) {
      return this.profileService.profiles().find(p => p.id === form.id) ?? null;
    }
    return null;
  });

  startAddNew(): void {
    this.formState.set({
      id: null,
      name: '',
      brokerUrl: '',
      imageUrl: ''
    });
    this.selectedProfileId.set(null);
  }
  
  startEdit(profile: ServerProfile): void {
    this.formState.set({ ...profile });
    this.selectedProfileId.set(profile.id);
  }
  
  cancelEdit(): void {
    this.formState.set(null);
    this.selectedProfileId.set(null);
  }

  saveProfile(): void {
    const state = this.formState();
    if (!state || !state.name.trim()) return;

    if (state.id) { // Editing existing
      this.profileService.updateProfile(state as ServerProfile);
    } else { // Adding new
      const { id, ...newProfileData } = state;
      this.profileService.addProfile(newProfileData);
    }
    this.formState.set(null);
    this.selectedProfileId.set(null);
  }
  
  deleteProfile(id: string): void {
    if (confirm('Are you sure you want to delete this profile?')) {
      const profileToUnmount = this.profileService.profiles().find(p => p.id === id);
      if (profileToUnmount && this.mountedProfileIds().includes(id)) {
        this.unmountProfile.emit(profileToUnmount);
      }
      this.profileService.deleteProfile(id);
      if (this.formState()?.id === id) {
        this.formState.set(null);
      }
      this.selectedProfileId.set(null);
    }
  }

  toggleMount(profile: ServerProfile): void {
    if (this.mountedProfileIds().includes(profile.id)) {
      this.unmountProfile.emit(profile);
    } else {
      this.mountProfile.emit(profile);
    }
  }

  onFormValueChange(event: Event, field: keyof Omit<FormState, 'id'>): void {
    const value = (event.target as HTMLInputElement).value;
    this.formState.update(state => state ? { ...state, [field]: value } : null);
  }
}
