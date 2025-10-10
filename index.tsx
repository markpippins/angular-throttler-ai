import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';

import { AppComponent } from './src/app.component';
import { RemoteFileSystemService } from './src/services/remote-file-system.service';
import { IS_DEBUG_MODE } from './src/services/app-config';
import { ElectronFileSystemService } from './src/services/electron-file-system.service';

// We assume the build process exposes DEBUG from .env as process.env.DEBUG
declare const process: any;
const isDebugMode = true;

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: IS_DEBUG_MODE, useValue: isDebugMode },
    // Provide both services. The AppComponent will decide which one to use.
    ElectronFileSystemService,
    RemoteFileSystemService,
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.