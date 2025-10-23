import { Injectable, inject } from '@angular/core';
import { GoogleSearchResult } from '../models/google-search-result.model.js';
import { ServerProfileService } from './server-profile.service.js';

export class SearchNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchNotConfiguredError';
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleSearchService {
  private profileService = inject(ServerProfileService);

  async search(query: string): Promise<GoogleSearchResult[]> {
    const searchUrl = this.profileService.activeProfile()?.searchUrl;

    if (!searchUrl) {
      throw new SearchNotConfiguredError('No searchUrl configured in active profile.');
    }

    try {
      console.log(`Attempting live web search via: ${searchUrl}`);
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from search service.' }));
        // If the backend service specifically says it's not configured, throw our custom error.
        if (response.status === 500 && errorData.error?.includes('not configured')) {
          console.warn('Backend search service is not configured with API keys.');
          throw new SearchNotConfiguredError('Backend search service is not configured with API keys. Please set GOOGLE_API_KEY and SEARCH_ENGINE_ID in your .env file.');
        }
        // For other errors, throw to indicate a real problem.
        throw new Error(errorData.error || `Search request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.items) {
        // A successful response with no items means no results were found.
        return [];
      }
      
      // Map the live Google Search API response to our model
      return data.items.map((item: any): GoogleSearchResult => ({
        title: item.title,
        link: item.link,
        displayLink: item.displayLink,
        snippet: item.snippet,
      }));

    } catch (e) {
      // If it's already our specific error, re-throw it to be caught by the component.
      if (e instanceof SearchNotConfiguredError) {
        throw e;
      }
      // For network errors or other unexpected issues, wrap them in a generic error.
      console.error('Live search failed.', e);
      throw new Error(`Live search failed: ${(e as Error).message}`);
    }
  }
}
