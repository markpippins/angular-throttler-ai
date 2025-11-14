import { Component, ChangeDetectionStrategy, signal, viewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from './loading-spinner.component.js';
import { SearchItemComponent } from './search-item.component.js';
import { CustomSearchResult, SearchQueryInfo } from '../../models/google-custom-search.model.js';

@Component({
  selector: 'app-complex-search',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, SearchItemComponent],
  templateUrl: './complex-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplexSearchComponent implements AfterViewInit {
  // Credentials
  apiKey = signal('');
  cx = signal('');

  // Main query
  query = signal('Angular Signals');

  // Parameters
  num = signal(10);
  start = signal(1);
  safe = signal('active');
  languageRestrict = signal('');
  countryRestrict = signal('');
  siteSearch = signal('');
  exactTerms = signal('');
  excludeTerms = signal('');
  orTerms = signal('');
  fileType = signal('');
  dateRestrict = signal('');

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  searchResult = signal<CustomSearchResult | null>(null);

  // FIX: Use the viewChild function instead of the decorator. It returns a signal.
  searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  languages = [
      { code: '', name: 'Any Language' },
      { code: 'lang_ar', name: 'Arabic' },
      { code: 'lang_zh-CN', name: 'Chinese (Simplified)' },
      { code: 'lang_zh-TW', name: 'Chinese (Traditional)' },
      { code: 'lang_cs', name: 'Czech' },
      { code: 'lang_da', name: 'Danish' },
      { code: 'lang_nl', name: 'Dutch' },
      { code: 'lang_en', name: 'English' },
      { code: 'lang_fi', name: 'Finnish' },
      { code: 'lang_fr', name: 'French' },
      { code: 'lang_de', name: 'German' },
      { code: 'lang_el', name: 'Greek' },
      { code: 'lang_he', name: 'Hebrew' },
      { code: 'lang_hu', name: 'Hungarian' },
      { code: 'lang_id', name: 'Indonesian' },
      { code: 'lang_it', name: 'Italian' },
      { code: 'lang_ja', name: 'Japanese' },
      { code: 'lang_ko', name: 'Korean' },
      { code: 'lang_no', name: 'Norwegian' },
      { code: 'lang_pl', name: 'Polish' },
      { code: 'lang_pt', name: 'Portuguese' },
      { code: 'lang_ru', name: 'Russian' },
      { code: 'lang_es', name: 'Spanish' },
      { code: 'lang_sv', name: 'Swedish' },
      { code: 'lang_tr', name: 'Turkish' },
    ];

  ngAfterViewInit(): void {
    setTimeout(() => {
        // FIX: Access the signal's value with () to get the ElementRef.
        this.searchInput().nativeElement.focus();
        this.searchInput().nativeElement.select();
    }, 100);
  }

  async performSearch(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.searchResult.set(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // MOCK RESPONSE
    this.searchResult.set({
      kind: 'customsearch#search',
      searchInformation: {
        searchTime: 0.45,
        formattedSearchTime: '0.45',
        totalResults: '123000',
        formattedTotalResults: '123,000',
      },
      items: [
        {
          kind: 'customsearch#result',
          title: 'Signal inputs - Angular',
          htmlTitle: 'Signal inputs - Angular',
          link: 'https://angular.dev/guide/signals/inputs',
          displayLink: 'angular.dev',
          snippet: 'Signal inputs are a new feature in Angular that provide a declarative way to handle component inputs. They are built on top of signals and offer better type safety ...',
          htmlSnippet: 'Signal inputs are a new feature in <b>Angular</b> that provide a declarative way to handle component inputs. They are built on top of <b>signals</b> and offer better type safety ...',
          formattedUrl: 'https://angular.dev/guide/signals/inputs',
          htmlFormattedUrl: 'https://angular.dev/guide/<b>signals</b>/inputs',
        },
        {
            kind: 'customsearch#result',
            title: 'Working with Signals in Angular - DigitalOcean',
            htmlTitle: 'Working with <b>Signals</b> in <b>Angular</b> - DigitalOcean',
            link: 'https://www.digitalocean.com/community/tutorials/working-with-signals-in-angular',
            displayLink: 'www.digitalocean.com',
            snippet: 'This tutorial will teach you how to use signals for state management in your Angular applications, including computed signals and effects.',
            htmlSnippet: 'This tutorial will teach you how to use <b>signals</b> for state management in your <b>Angular</b> applications, including computed <b>signals</b> and effects.',
            formattedUrl: 'https://www.digitalocean.com/community/tutorials/working-with-signals-in-angular',
            htmlFormattedUrl: 'https://www.digitalocean.com/community/tutorials/working-with-<b>signals</b>-in-<b>angular</b>',
            pagemap: {
                cse_thumbnail: [{ src: 'https://picsum.photos/seed/search1/200/200' }]
            }
        },
        {
            kind: 'customsearch#result',
            title: 'Angular Signals: The Future of State Management - YouTube',
            htmlTitle: '<b>Angular Signals</b>: The Future of State Management - YouTube',
            link: 'https://www.youtube.com/watch?v=example',
            displayLink: 'www.youtube.com',
            snippet: 'A video presentation on the benefits of using signals in Angular for reactive state management. Covers performance improvements and best practices.',
            htmlSnippet: 'A video presentation on the benefits of using <b>signals</b> in <b>Angular</b> for reactive state management. Covers performance improvements and best practices.',
            formattedUrl: 'https://www.youtube.com/watch?v=example',
            htmlFormattedUrl: 'https://www.youtube.com/watch?v=example',
        }
      ],
      queries: {
        nextPage: [{
            title: "Next Page",
            totalResults: "123000",
            searchTerms: "Angular Signals",
            count: 10,
            startIndex: 11,
            inputEncoding: "utf8",
            outputEncoding: "utf8",
            safe: "active",
            cx: this.cx(),
        }],
      }
    });

    this.loading.set(false);
  }

  goToPage(newStartIndex: number): void {
    this.start.set(newStartIndex);
    this.performSearch();
  }
}
