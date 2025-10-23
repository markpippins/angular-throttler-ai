import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RssItem {
  title: string;
  source: string;
  date: string;
  snippet: string;
  link: string;
}

@Component({
  selector: 'app-rss-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rss-feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RssFeedComponent {
  filterQuery = input('');

  private mockRssItems: RssItem[] = [
    {
      title: 'Angular v20 Released with Major Performance Boosts',
      source: 'Official Angular Blog',
      date: '2 hours ago',
      snippet: 'The new release introduces significant improvements to the rendering engine and build times...',
      link: '#',
    },
    {
      title: 'Exploring the new Signals API in Angular',
      source: 'Dev Community',
      date: '1 day ago',
      snippet: 'A deep dive into how signals are changing state management for the better in modern Angular apps.',
      link: '#',
    },
    {
      title: 'Component Design Patterns for Scalable Apps',
      source: 'Smashing Magazine',
      date: '3 days ago',
      snippet: 'Learn about best practices for creating maintainable and reusable components in large-scale projects.',
      link: '#',
    },
  ];
  
  filteredItems = computed(() => {
    const query = this.filterQuery().toLowerCase();
    if (!query) {
      return this.mockRssItems;
    }
    return this.mockRssItems.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.snippet.toLowerCase().includes(query)
    );
  });
}
