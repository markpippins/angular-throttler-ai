import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';

import { AppComponent } from './src/app.component';
import { FILE_SYSTEM_PROVIDER } from './src/services/file-system-provider';
import { FileSystemService } from './src/services/file-system.service';
import { RemoteFileSystemService } from './src/services/remote-file-system.service';
import { IS_DEBUG_MODE, APP_CONFIG } from './src/services/app-config';

// We assume the build process exposes DEBUG from .env as process.env.DEBUG
declare const process: any;
const isDebugMode = true;

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: IS_DEBUG_MODE, useValue: isDebugMode },
    {
      provide: APP_CONFIG,
      useValue: {
        brokerUrl: 'http://localhost:8080/api/broker/submitRequest',
        imageUrl: 'http://localhost:8081',
      },
    },
    {
      provide: FILE_SYSTEM_PROVIDER,
      useClass: isDebugMode ? FileSystemService : RemoteFileSystemService,
    },
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.