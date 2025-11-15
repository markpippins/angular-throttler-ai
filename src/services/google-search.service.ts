import { Injectable, inject } from '@angular/core';
import { GoogleSearchResult } from '../models/google-search-result.model.js';
import { BrokerService } from './broker.service.js';
import { ServerProfileService } from './server-profile.service.js';

@Injectable({
  providedIn: 'root',
})
export class GoogleSearchService {
  private brokerService = inject(BrokerService);
  private serverProfileService = inject(ServerProfileService);

  private constructBrokerUrl(baseUrl: string): string {
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

  async search(query: string, path: string[]): Promise<GoogleSearchResult[]> {
    const activeProfile = this.serverProfileService.activeProfile();
    if (!activeProfile || !activeProfile.brokerUrl) {
      console.warn('GoogleSearchService: No active profile with a brokerUrl configured. Returning empty results.');
      return Promise.resolve([]);
    }

    try {
      const brokerUrl = this.constructBrokerUrl(activeProfile.brokerUrl);
      
      const results = await this.brokerService.submitRequest<GoogleSearchResult[]>(brokerUrl, 'googleSearch', 'simple', {
        query,
        path,
      });

      // The backend might return null or not an array.
      return Array.isArray(results) ? results : [];

    } catch (error) {
      console.error('Google search via broker failed:', error);
      // It's better to return an empty array than to throw, so the UI doesn't break.
      return [];
    }
  }
}
