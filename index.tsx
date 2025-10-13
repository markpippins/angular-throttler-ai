import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';

import { AppComponent } from './src/app.component';
import { IS_DEBUG_MODE } from './src/services/app-config';
import { ElectronFileSystemService } from './src/services/electron-file-system.service';
import { DESKTOP_SERVICE } from './src/services/desktop.service';
import { ElectronDesktopService } from './src/services/electron-desktop.service';
import { ConvexDesktopService } from './src/services/convex-desktop.service';

// We assume the build process exposes DEBUG from .env as process.env.DEBUG
declare const process: any;
const isDebugMode = true;

declare global {
  interface Window {
    // FIX: The desktopApi is optional as it's only available in an Electron environment.
    desktopApi?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: IS_DEBUG_MODE, useValue: isDebugMode },
    {
      provide: DESKTOP_SERVICE,
      useClass: ElectronDesktopService,
    },
    // Provide all necessary services. The AppComponent will orchestrate them.
    ElectronFileSystemService,
    ConvexDesktopService,
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
