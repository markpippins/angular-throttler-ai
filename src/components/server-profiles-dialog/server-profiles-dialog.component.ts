import { Component, ChangeDetectionStrategy, output, inject, signal, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerProfileService } from '../../services/server-profile.service.js';
import { ServerProfile } from '../../models/server-profile.model.js';
import { User } from '../../models/user.model.js';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component.js';
import { ToastService } from '../../services/toast.service.js';

type FormState = {
  id: string | null;
  name: string;
  brokerUrl: string;
  imageUrl: string;
  searchUrl: string;
  autoConnect: boolean;
}

@Component({
  selector: 'app-server-profiles-dialog',
  templateUrl: './server-profiles-dialog.component.html',
  imports: [CommonModule, LoginDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerProfilesDialogComponent {
  profileService = inject(ServerProfileService);
  toastService = inject(ToastService);
  
  mountedProfileIds = input<string[]>([]);
  mountedProfileUsers = input<Map<string, User>>(new Map());
  close = output<void>();
  loginAndMount = output<{ profile: ServerProfile, username: string, password: string }>();
  unmountProfile = output<ServerProfile>();

  selectedProfileId = signal<string | null>(null);
  
  // Form state for editing/creating
  formState = signal<FormState | null>(null);

  // State for login dialog
  isLoginDialogOpen = signal(false);
  profileToLogin = signal<ServerProfile | null>(null);

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
      searchUrl: '',
      autoConnect: false,
    });
    this.selectedProfileId.set(null);
  }
  
  startEdit(profile: ServerProfile): void {
    this.formState.set({ ...profile, searchUrl: profile.searchUrl ?? '', autoConnect: profile.autoConnect ?? false });
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
      this.toastService.show(`Profile "${state.name}" updated.`);
    } else { // Adding new
      const { id, ...newProfileData } = state;
      this.profileService.addProfile(newProfileData);
      this.toastService.show(`Profile "${state.name}" created.`);
      this.formState.set(null);
      this.selectedProfileId.set(null);
    }
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

  openLoginDialog(profile: ServerProfile): void {
    this.profileToLogin.set(profile);
    this.isLoginDialogOpen.set(true);
  }

  closeLoginDialog(): void {
    this.isLoginDialogOpen.set(false);
    this.profileToLogin.set(null);
  }

  onLoginSubmitted({ username, password }: { username: string, password: string }): void {
    const profile = this.profileToLogin();
    if (profile) {
      this.loginAndMount.emit({ profile, username, password });
    }
    this.closeLoginDialog();
  }

  handleUnmount(profile: ServerProfile): void {
    this.unmountProfile.emit(profile);
  }

  onFormValueChange(event: Event, field: keyof Omit<FormState, 'id'>): void {
    const input = event.target as HTMLInputElement;
    const value = input.type === 'checkbox' ? input.checked : input.value;
    this.formState.update(state => state ? { ...state, [field]: value } : null);
  }
}