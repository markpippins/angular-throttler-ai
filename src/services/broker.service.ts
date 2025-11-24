import { Injectable, inject, signal } from '@angular/core';
import { ServerProfileService } from './server-profile.service.js';
import { LocalConfigService } from './local-config.service.js';

export interface BrokerRequestInfo {
  service: string;
  operation: string;
  requestId: string;
  timestamp: number;
}

export interface BrokerResponseInfo {
  service: string;
  operation: string;
  requestId: string;
  status: 'success' | 'error';
  message?: string;
  timestamp: number;
  duration: number;
}


@Injectable({
  providedIn: 'root',
})
export class BrokerService {
  private localConfigService = inject(LocalConfigService);

  lastRequest = signal<BrokerRequestInfo | null>(null);
  lastResponse = signal<BrokerResponseInfo | null>(null);
  
  private generateUUID(): string {
    var d = new Date().getTime();
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;
        if(d > 0){
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  resolveUrl(baseUrl: string): string {
    let fullUrl = baseUrl.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = `http://${fullUrl}`;
    }
    if (fullUrl.endsWith('/')) {
        fullUrl = fullUrl.slice(0, -1);
    }
    fullUrl += '/api/broker/submitRequest';
    return fullUrl;
  }

  async submitRequest<T>(brokerUrl: string, service: string, operation: string, params: object = {}): Promise<T> {
    const request = {
        service,
        operation,
        params,
        requestId: this.generateUUID()
    };
    const startTime = Date.now();

    this.lastRequest.set({
      service,
      operation,
      requestId: request.requestId,
      timestamp: startTime,
    });

    const shouldLog = this.localConfigService.currentConfig().logBrokerMessages;

    if (shouldLog) {
      console.groupCollapsed(`[Broker Request] ${service}/${operation} (ID: ${request.requestId})`);
      console.log('Request Payload:', request);
      console.time(`[Broker Response] ${request.requestId}`);
    }

    try {
      const response = await fetch(brokerUrl, {
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
      });

      if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Broker request failed with status ${response.status}: ${errorBody}`);
      }

      const serviceResponse = await response.json();
      const duration = Date.now() - startTime;

      if (shouldLog) {
          console.timeEnd(`[Broker Response] ${request.requestId}`);
          console.log('Response Payload:', serviceResponse);
      }

      if (serviceResponse.ok) {
          this.lastResponse.set({
            service, operation, requestId: request.requestId,
            status: 'success', timestamp: Date.now(), duration
          });
          if (shouldLog) {
            console.groupEnd();
          }
          return serviceResponse.data as T;
      } else {
          const errorDetails = serviceResponse.errors.map((e: any) => e.message || `${e.code}: ${e.path}`).join(', ');
          this.lastResponse.set({
            service, operation, requestId: request.requestId,
            status: 'error', message: errorDetails, timestamp: Date.now(), duration
          });
          throw new Error(`Service operation ${service}/${operation} failed: ${errorDetails}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
       this.lastResponse.set({
            service, operation, requestId: request.requestId,
            status: 'error', message: (error as Error).message, timestamp: Date.now(), duration
        });
      if (shouldLog) {
        console.timeEnd(`[Broker Response] ${request.requestId}`);
        console.error('Request Failed:', error);
        console.groupEnd();
      }
      throw error;
    }
  }
}
