import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, of } from 'rxjs';
import { ServerProfile } from '../models/server-profile.model.js';
import { LocalConfigService } from './local-config.service.js';

export type ServiceStatus = 'UP' | 'DOWN' | 'UNKNOWN' | 'CHECKING';

@Injectable({
  providedIn: 'root',
})
export class HealthCheckService {
  public readonly serviceStatuses = signal<Map<string, ServiceStatus>>(new Map()).asReadonly();

  getServiceStatus(baseUrl: string): ServiceStatus {
    return 'UNKNOWN';
  }

  monitorService(profile: any): void {
    // This service is disabled.
  }

  private async _checkHealth(baseUrl: string, delayMs: number): Promise<void> {
    // This service is disabled.
  }

  stopAllMonitoring(): void {
    // This service is disabled.
  }
}
