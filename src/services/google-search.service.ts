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
    const { brokerUrl, token, query } = params;
    
    if (!brokerUrl) {
      console.warn('GoogleSearchService: No brokerUrl provided. Returning empty results.');
      return Promise.resolve([]);
    }
    if (!token) {
      console.warn('GoogleSearchService: No token provided. Returning empty results.');
      return Promise.resolve([]);
    }
    if (!query || query.trim() === '') {
      // Don't send a search request for an empty query.
      return Promise.resolve([]);
    }

    try {
      const results = await this.brokerService.submitRequest<GoogleSearchResult[]>(this.constructBrokerUrl(brokerUrl), 'googleSearch', 'simple', {
        token,
        query,
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