import { Component, ChangeDetectionStrategy, output, inject, signal, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerProfileService } from '../../services/server-profile.service.js';
import { ServerProfile } from '../../models/server-profile.model.js';
import { User } from '../../models/user.model.js';

type FormState = {
  id: string | null;
  name: string;
  brokerUrl: string;
  imageUrl: string;
  autoConnect: boolean;
}

@Component({
  selector: 'app-server-profiles-dialog',
  templateUrl: './server-profiles-dialog.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerProfilesDialogComponent {
  profileService = inject(ServerProfileService);
  
  mountedProfileIds = input<string[]>([]);
  mountedProfileUsers = input<Map<string, User>>(new Map());
  close = output<void>();
  loginAndMount = output<{ profile: ServerProfile, username: string, password: string }>();
  unmountProfile = output<ServerProfile>();

  selectedProfileId = signal<string | null>(null);
  
  // Form state for editing/creating
  formState = signal<FormState | null>(null);

  // State for login form
  loginUsername = signal('');
  loginPassword = signal('');

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
      imageUrl: '',
      autoConnect: false,
    });
    this.selectedProfileId.set(null);
  }
  
  startEdit(profile: ServerProfile): void {
    this.formState.set({ ...profile, autoConnect: profile.autoConnect ?? false });
    this.selectedProfileId.set(profile.id);
    this.loginUsername.set('');
    this.loginPassword.set('');
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

  handleLoginAndMount(profile: ServerProfile): void {
    const username = this.loginUsername().trim();
    const password = this.loginPassword().trim();
    if (username && password) {
      this.loginAndMount.emit({ profile, username, password });
    } else {
      alert('Please enter a username and password.');
    }
  }

  handleUnmount(profile: ServerProfile): void {
    this.unmountProfile.emit(profile);
  }

  onFormValueChange(event: Event, field: keyof Omit<FormState, 'id'>): void {
    const input = event.target as HTMLInputElement;
    const value = input.type === 'checkbox' ? input.checked : input.value;
    this.formState.update(state => state ? { ...state, [field]: value } : null);
  }

  onLoginUsernameChange(event: Event): void {
      this.loginUsername.set((event.target as HTMLInputElement).value);
  }

  onLoginPasswordChange(event: Event): void {
      this.loginPassword.set((event.target as HTMLInputElement).value);
  }
}
