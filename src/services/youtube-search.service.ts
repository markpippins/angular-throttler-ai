import { Injectable } from '@angular/core';
import { YouTubeSearchResult } from '../models/youtube-search-result.model.js';

@Injectable({ providedIn: 'root' })
export class YoutubeSearchService {
  private mockResults: YouTubeSearchResult[] = [
    {
      id: '3qFB8I2EDfI',
      title: "What's New in Angular v17",
      description:
        "Angular v17 is here and it brings a ton of new features! In this video, we'll go over the most important ones, including the new built-in control flow, deferred loading, and more!",
      thumbnailUrl: 'https://picsum.photos/seed/youtube2/480/360',
      channelTitle: 'Academind',
      publishedAt: '6 months ago',
      viewCount: '540K',
    },
    {
      id: 'C_7_2tY_2sE',
      title: 'Building a Modern UI with Tailwind CSS',
      description:
        'A comprehensive tutorial on how to use Tailwind CSS to build beautiful, responsive user interfaces from scratch. No custom CSS needed!',
      thumbnailUrl: 'https://picsum.photos/seed/youtube3/480/360',
      channelTitle: 'Traversy Media',
      publishedAt: '2 years ago',
      viewCount: '2.5M',
    },
    {
      id: 'f_n5s_h4j_I',
      title: 'Introduction to RxJS for Angular Developers',
      description:
        'A deep dive into RxJS observables, operators, and how to use them effectively in an Angular application for managing asynchronous data streams.',
      thumbnailUrl: 'https://picsum.photos/seed/youtube4/480/360',
      channelTitle: 'Joshua Morony',
      publishedAt: '11 months ago',
      viewCount: '230K',
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'Angular Standalone Components in 100 Seconds',
      description:
        'Learn the basics of Standalone Components in Angular, including how to bootstrap an app, use them with the router, and lazy load them.',
      thumbnailUrl: 'https://picsum.photos/seed/youtube1/480/360',
      channelTitle: 'Fireship',
      publishedAt: '1 year ago',
      viewCount: '1.2M',
    },
  ];

  async search(query: string): Promise<YouTubeSearchResult[]> {
    console.log(`YoutubeSearchService: Searching for "${query}"`);
    await new Promise((resolve) => setTimeout(resolve, 900));
    if (!query) return [];
    // Return a copy to prevent mutation
    return [...this.mockResults];
  }
}
