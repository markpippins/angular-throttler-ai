import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface AppPreferences {
  iconTheme: string;
}

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  private http = inject(HttpClient);
  
  iconTheme = signal<string | null>(null);
  
  constructor() {
    this.loadPreferences();
  }
  
  private loadPreferences(): void {
    this.http.get<AppPreferences>('assets/config/preferences.json').subscribe({
      next: prefs => {
        if (prefs && prefs.iconTheme) {
          this.iconTheme.set(prefs.iconTheme);
          console.log(`Icon theme set to: ${prefs.iconTheme}`);
        }
      },
      error: err => {
        console.error('Could not load preferences.json. Local icons will be disabled.', err);
      }
    });
  }
}
