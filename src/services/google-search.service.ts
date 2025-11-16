import { Injectable, inject } from '@angular/core';
import { GoogleSearchResult } from '../models/google-search-result.model.js';
import { BrokerService } from './broker.service.js';

export interface GoogleSearchParams {
  brokerUrl: string;
  token: string;
  query: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleSearchService {
  private brokerService = inject(BrokerService);

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

  async search(params: GoogleSearchParams): Promise<GoogleSearchResult[]> {
    if (!params.brokerUrl) {
      console.warn('GoogleSearchService: No brokerUrl provided. Returning empty results.');
      return Promise.resolve([]);
    }
    if (!params.token) {
      console.warn('GoogleSearchService: No token provided. Returning empty results.');
      return Promise.resolve([]);
    }
    if (!params.query || params.query.trim() === '') {
      // Don't send a search request for an empty query.
      return Promise.resolve([]);
    }

    try {
      // Explicitly create the params object for the broker request
      // to ensure it matches the required structure exactly.
      const brokerParams = {
        token: params.token,
        query: params.query,
      };

      const results = await this.brokerService.submitRequest<GoogleSearchResult[]>(
        this.constructBrokerUrl(params.brokerUrl), 
        'googleSearchService', 
        'simpleSearch', 
        brokerParams
      );

      // The backend might return null or not an array.
      return Array.isArray(results) ? results : [];

    } catch (error) {
      console.error('Google search via broker failed:', error);
      // It's better to return an empty array than to throw, so the UI doesn't break.
      return [];
    }
  }
}
