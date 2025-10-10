import { InjectionToken } from '@angular/core';

export const IS_DEBUG_MODE = new InjectionToken<boolean>('IS_DEBUG_MODE');

export interface AppConfig {
  brokerUrl: string;
  imageUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');