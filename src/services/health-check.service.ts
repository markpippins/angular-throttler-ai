import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, of } from 'rxjs';
import { ServerProfile } from '../models/server-profile.model.js';
import { LocalConfigService } from './local-config.service.js';

export type ServiceStatus = 'UP' | 'DOWN' | 'UNKNOWN' | 'CHECKING';

interface HealthCheckResponse {
  status: 'UP' | 'DOWN';
}

@Injectable({
  providedIn: 'root',
})
export class HealthCheckService {
  private http = inject(HttpClient);
  private localConfigService = inject(LocalConfigService);

  private _serviceStatuses = signal<Map<string, ServiceStatus>>(new Map());
  // FIX: Expose serviceStatuses as a public readonly signal for reactivity.
  public readonly serviceStatuses = this._serviceStatuses.asReadonly();
  private serviceTimers = new Map<string, any>();

  getServiceStatus(baseUrl: string): ServiceStatus {
    return this._serviceStatuses().get(baseUrl) ?? 'UNKNOWN';
  }

  monitorService(profile: Pick<ServerProfile, 'imageUrl' | 'healthCheckDelayMinutes'>): void {
    const baseUrl = profile.imageUrl;
    if (!baseUrl || this._serviceStatuses().has(baseUrl)) {
      return; // Already monitoring or no URL to monitor
    }

    this._serviceStatuses.update(map => new Map(map).set(baseUrl, 'CHECKING'));
    
    const delayMinutes = profile.healthCheckDelayMinutes ?? this.localConfigService.currentConfig().healthCheckDelayMinutes;
    const delayMs = delayMinutes * 60 * 1000;

    this._checkHealth(baseUrl, delayMs);
  }

  private async _checkHealth(baseUrl: string, delayMs: number): Promise<void> {
    const healthUrl = `${baseUrl}/health`;
    
    try {
      const response$ = this.http.get<HealthCheckResponse>(healthUrl).pipe(
        catchError(() => of({ status: 'DOWN' } as HealthCheckResponse))
      );
      const response = await firstValueFrom(response$);
      
      if (response.status === 'UP') {
        this._serviceStatuses.update(map => new Map(map).set(baseUrl, 'UP'));
        // If it was down, clear the timer. We don't need to poll a healthy service.
        if (this.serviceTimers.has(baseUrl)) {
            clearTimeout(this.serviceTimers.get(baseUrl));
            this.serviceTimers.delete(baseUrl);
        }
      } else {
        throw new Error('Health check returned DOWN');
      }
    } catch (error) {
      // Any error (network, or status DOWN) leads to this block
      this._serviceStatuses.update(map => new Map(map).set(baseUrl, 'DOWN'));
      console.warn(`Health check for ${baseUrl} failed. Retrying in ${delayMs / 1000 / 60} minutes.`);

      // Clear any existing timer for this URL before setting a new one
      if (this.serviceTimers.has(baseUrl)) {
        clearTimeout(this.serviceTimers.get(baseUrl));
      }

      const timerId = setTimeout(() => {
        this.serviceTimers.delete(baseUrl); // Clean up before next check
        this._serviceStatuses.update(map => new Map(map).set(baseUrl, 'CHECKING'));
        this._checkHealth(baseUrl, delayMs);
      }, delayMs);
      this.serviceTimers.set(baseUrl, timerId);
    }
  }

  stopAllMonitoring(): void {
    for (const timerId of this.serviceTimers.values()) {
        clearTimeout(timerId);
    }
    this.serviceTimers.clear();
    this._serviceStatuses.set(new Map());
  }
}
