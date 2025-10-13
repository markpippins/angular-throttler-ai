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
  templateUrl: './server-profiles-dialog.component.html',
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