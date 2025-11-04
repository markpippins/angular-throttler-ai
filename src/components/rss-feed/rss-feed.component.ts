import { Component, ChangeDetectionStrategy, input, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebviewService } from '../../services/webview.service.js';

interface RssItem {
  title: string;
  source: string;
  date: string;
  snippet: string;
  link: string;
}

interface RssFeed {
  name: string;
  url: string;
}

@Component({
  selector: 'app-rss-feed',
  imports: [CommonModule],
  templateUrl: './rss-feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RssFeedComponent implements OnInit {
  filterQuery = input('');
  private webviewService = inject(WebviewService);

  // --- State Signals ---
  feeds = signal<RssFeed[]>([]);
  selectedFeedUrl = signal<string | null>(null);
  articles = signal<Map<string, RssItem[]>>(new Map());
  isLoading = signal(false);

  isAddingFeed = signal(false);
  newFeedUrl = signal('');
  isFeedDropdownOpen = signal(false);

  // --- Computed Signals ---
  selectedFeed = computed(() => {
    const url = this.selectedFeedUrl();
    if (!url) return null;
    return this.feeds().find(f => f.url === url);
  });

  filteredItems = computed(() => {
    const url = this.selectedFeedUrl();
    if (!url) return [];

    const feedArticles = this.articles().get(url) ?? [];
    const query = this.filterQuery().toLowerCase();

    if (!query) {
      return feedArticles;
    }
    return feedArticles.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.snippet.toLowerCase().includes(query)
    );
  });
  
  ngOnInit(): void {
    this.setupMockData();
    const firstFeed = this.feeds()[0];
    if (firstFeed) {
      this.selectFeed(firstFeed);
    }
  }

  private setupMockData(): void {
    const mockFeeds: RssFeed[] = [
      { name: 'Angular Blog', url: 'angular.io/blog' },
      { name: 'Smashing Magazine', url: 'smashingmagazine.com/feed' },
    ];
    this.feeds.set(mockFeeds);

    const mockArticles = new Map<string, RssItem[]>();
    mockArticles.set('angular.io/blog', [
      {
        title: 'Angular v20 Released with Major Performance Boosts',
        source: 'Official Angular Blog',
        date: '2 hours ago',
        snippet: 'The new release introduces significant improvements to the rendering engine and build times...',
        link: 'https://blog.angular.io/',
      },
      {
        title: 'Exploring the new Signals API in Angular',
        source: 'Official Angular Blog',
        date: '1 day ago',
        snippet: 'A deep dive into how signals are changing state management for the better in modern Angular apps.',
        link: 'https://blog.angular.io/',
      },
    ]);
    mockArticles.set('smashingmagazine.com/feed', [
       {
        title: 'Component Design Patterns for Scalable Apps',
        source: 'Smashing Magazine',
        date: '3 days ago',
        snippet: 'Learn about best practices for creating maintainable and reusable components in large-scale projects.',
        link: 'https://www.smashingmagazine.com/2023/01/front-end-testing-playwright-end-to-end-tests/',
      },
      {
        title: 'A Guide To Modern CSS Colors With RGB, HSL, HWB, LAB And LCH',
        source: 'Smashing Magazine',
        date: '5 days ago',
        snippet: 'A look into how we can use the modern CSS color spaces to build more accessible and vibrant websites.',
        link: 'https://www.smashingmagazine.com/2021/11/guide-modern-css-colors-rgb-hsl-hwb-lab-lch/',
      },
    ]);
    this.articles.set(mockArticles);
  }

  toggleFeedDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isFeedDropdownOpen.update(v => !v);
  }

  selectFeed(feed: RssFeed): void {
    this.selectedFeedUrl.set(feed.url);
    this.isFeedDropdownOpen.set(false);
    this.refreshFeed();
  }

  refreshFeed(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    // Simulate network delay
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  toggleAddFeed(): void {
    this.isAddingFeed.update(v => !v);
    this.newFeedUrl.set(''); // Reset input on toggle
  }

  saveNewFeed(): void {
    const url = this.newFeedUrl().trim();
    if (!url) return;

    // Mock: just add it to the list. A real app would validate and fetch the feed.
    const name = url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0];
    const newFeed: RssFeed = { name, url };
    
    this.feeds.update(feeds => [...feeds, newFeed]);
    this.articles.update(articles => new Map(articles).set(url, [])); // Add empty articles for now
    this.selectFeed(newFeed);
    this.isAddingFeed.set(false);
    this.newFeedUrl.set('');
  }

  openArticle(item: RssItem): void {
    this.webviewService.open(item.link, item.title);
  }
}
