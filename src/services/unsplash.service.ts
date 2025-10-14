import { Injectable, inject } from '@angular/core';
import { ImageSearchResult } from '../models/image-search-result.model.js';
import { BrokerService } from './broker.service.js';
import { ServerProfileService } from './server-profile.service.js';

const SERVICE_NAME = 'unsplashService'; // This will map to image-search.ts

@Injectable({ providedIn: 'root' })
export class UnsplashService {
  private broker = inject(BrokerService);
  private profileService = inject(ServerProfileService);

  private mockResults: ImageSearchResult[] = [
    {
      id: '1',
      description: 'A robot holding a red skateboard.',
      alt_description: 'robot with skateboard',
      urls: { thumb: 'https://picsum.photos/id/101/200/150', small: 'https://picsum.photos/id/101/400/300', regular: 'https://picsum.photos/id/101/800/600' },
      user: { name: 'Photo Bot', portfolio_url: 'https://picsum.photos/' }
    },
    {
      id: '2',
      description: 'A serene mountain landscape.',
      alt_description: 'mountain landscape',
      urls: { thumb: 'https://picsum.photos/id/10/200/150', small: 'https://picsum.photos/id/10/400/300', regular: 'https://picsum.photos/id/10/800/600' },
      user: { name: 'Nature Fan', portfolio_url: 'https://picsum.photos/' }
    },
    {
      id: '3',
      description: 'A modern city skyline at night.',
      alt_description: 'city at night',
      urls: { thumb: 'https://picsum.photos/id/20/200/150', small: 'https://picsum.photos/id/20/400/300', regular: 'https://picsum.photos/id/20/800/600' },
      user: { name: 'Urban Explorer', portfolio_url: 'https://picsum.photos/' }
    },
    {
      id: '4',
      description: 'Close-up of a colorful bird.',
      alt_description: 'colorful bird',
      urls: { thumb: 'https://picsum.photos/id/30/200/150', small: 'https://picsum.photos/id/30/400/300', regular: 'https://picsum.photos/id/30/800/600' },
      user: { name: 'Bird Watcher', portfolio_url: 'https://picsum.photos/' }
    }
  ];

  async search(query: string): Promise<ImageSearchResult[]> {
    console.log(`UnsplashService: Searching for "${query}"`);
    await new Promise(resolve => setTimeout(resolve, 700));
    if (!query) return [];
    return this.mockResults;
  }
}
