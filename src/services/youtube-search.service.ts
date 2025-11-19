import { Injectable, inject } from '@angular/core';
import { YoutubeSearchResult } from '../models/youtube-search-result.model.js';
import { BrokerService } from './broker.service.js';

export interface YoutubeSearchParams {
  brokerUrl: string;
  token: string;
  query: string;
}

// Based on the user's provided Java class
interface SearchResultItem {
  kind?: string;
  title: string;
  link?: string;
  snippet: string;
  videoId: string;
  channelTitle: string;
  publishDate?: string;
  thumbnailUrl: string;
  mediumThumbnailUrl?: string;
  highThumbnailUrl?: string;
  publishedAt: string;
}

interface SearchResult {
  items: SearchResultItem[];
}

@Injectable({
  providedIn: 'root',
})
export class YoutubeSearchService {
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
  
  async search(params: YoutubeSearchParams): Promise<YoutubeSearchResult[]> {
    if (!params.brokerUrl || !params.token || !params.query.trim()) {
      return Promise.resolve([]);
    }

    try {
      const brokerParams = {
        token: params.token,
        query: params.query,
      };

      // Assuming the backend service returns a wrapper object with an 'items' array.
      const result = await this.brokerService.submitRequest<SearchResult>(
        this.constructBrokerUrl(params.brokerUrl), 
        'youtubeSearchService', 
        'simpleSearch', 
        brokerParams
      );

      if (result && Array.isArray(result.items)) {
        return result.items.map(item => ({
          videoId: item.videoId,
          title: item.title,
          description: item.snippet,
          thumbnailUrl: item.mediumThumbnailUrl || item.thumbnailUrl, // Prefer medium thumbnail for cards
          channelTitle: item.channelTitle,
          publishedAt: item.publishedAt || item.publishDate || new Date().toISOString(),
        }));
      }
      return [];
    } catch (error) {
      console.error('YouTube search via broker failed:', error);
      return [];
    }
  }
}
