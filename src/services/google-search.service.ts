import { Injectable, inject } from '@angular/core';
import { GoogleSearchResult } from '../models/google-search-result.model.js';
import { ServerProfileService } from './server-profile.service.js';

@Injectable({ providedIn: 'root' })
export class GoogleSearchService {
  private profileService = inject(ServerProfileService);

  // Mock data
  private mockResults: GoogleSearchResult[] = [
    {
      title: 'Angular - The modern web developer\'s platform',
      link: 'https://angular.dev/',
      displayLink: 'angular.dev',
      snippet: 'Angular is an application design framework and development platform for creating efficient and sophisticated single-page apps.',
    },
    {
      title: 'Angular Signals | Angular',
      link: 'https://angular.dev/guide/signals',
      displayLink: 'angular.dev',
      snippet: 'Signals are a system that granularly tracks how and where your state is used throughout an application, allowing the framework to optimize rendering updates.',
    },
     {
      title: 'Introduction to Tailwind CSS',
      link: 'https://tailwindcss.com/docs/utility-first',
      displayLink: 'tailwindcss.com',
      snippet: 'A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.',
    },
  ];

  private getMockResults(query: string): GoogleSearchResult[] {
    if (!query) return [];
    return this.mockResults.filter(r => 
      r.title.toLowerCase().includes(query.toLowerCase()) || 
      r.snippet.toLowerCase().includes(query.toLowerCase())
    );
  }

  async search(query: string): Promise<GoogleSearchResult[]> {
    const searchUrl = this.profileService.activeProfile()?.searchUrl;

    if (searchUrl) {
      try {
        console.log(`Attempting live web search via: ${searchUrl}`);
        const response = await fetch(searchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from search service.' }));
          // If the backend service specifically says it's not configured, fall back gracefully.
          if (response.status === 500 && errorData.error?.includes('not configured')) {
            console.warn('Backend search service is not configured with API keys. Falling back to mock data.');
            return this.getMockResults(query);
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
        console.error('Live search failed, falling back to mock data.', e);
        return this.getMockResults(query);
      }
    } else {
      console.log('No searchUrl configured in active profile. Using mock search data.');
      // Fallback to mock data if searchUrl is not provided in the profile.
      await new Promise(resolve => setTimeout(resolve, 500)); // Keep simulated delay
      return this.getMockResults(query);
    }
  }
}