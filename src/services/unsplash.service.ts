import { Injectable, inject } from '@angular/core';
import { ImageSearchResult } from '../models/image-search-result.model.js';
import { BrokerService } from './broker.service.js';

export interface UnsplashSearchParams {
  brokerUrl: string;
  token: string;
  query: string;
}

// Based on the user's provided Java class
interface SearchResultItem {
  link: string;
  displayLink: string;
  description: string;
  regularImageUrl: string;
  thumbImageUrl: string;
  photographerName: string;
  createdAt: string;
  // Other fields are not used.
}

interface SearchResult {
  items: SearchResultItem[];
}

@Injectable({
  providedIn: 'root',
})
export class UnsplashService {
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

  async search(params: UnsplashSearchParams): Promise<ImageSearchResult[]> {
    if (!params.brokerUrl || !params.token || !params.query.trim()) {
      return Promise.resolve([]);
    }

    try {
      const brokerParams = {
        token: params.token,
        query: params.query,
      };

      const result = await this.brokerService.submitRequest<SearchResult>(
        this.constructBrokerUrl(params.brokerUrl), 
        'unsplashSearchService', 
        'simpleSearch', 
        brokerParams
      );

      if (result && Array.isArray(result.items)) {
        return result.items.map(item => ({
          id: item.link, // Use link as a unique ID
          url: item.regularImageUrl,
          thumbnailUrl: item.thumbImageUrl,
          description: item.description,
          photographer: item.photographerName,
          source: item.displayLink,
          publishedAt: item.createdAt,
        }));
      }

      return [];

    } catch (error) {
      console.error('Unsplash search via broker failed:', error);
      return [];
    }
  }
}
