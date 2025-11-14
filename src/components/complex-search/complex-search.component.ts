import { Component, ChangeDetectionStrategy, signal, viewChild, ElementRef, AfterViewInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ComplexSearchParams {
  query: string;
  num: number;
  start: number;
  safe: string;
  languageRestrict: string;
  countryRestrict: string;
  siteSearch: string;
  exactTerms: string;
  excludeTerms: string;
  orTerms: string;
  fileType: string;
  dateRestrict: string;
}

@Component({
  selector: 'app-complex-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './complex-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplexSearchComponent implements AfterViewInit {
  search = output<ComplexSearchParams>();

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

  performSearch(): void {
    this.search.emit({
      query: this.query(),
      num: this.num(),
      start: this.start(),
      safe: this.safe(),
      languageRestrict: this.languageRestrict(),
      countryRestrict: this.countryRestrict(),
      siteSearch: this.siteSearch(),
      exactTerms: this.exactTerms(),
      excludeTerms: this.excludeTerms(),
      orTerms: this.orTerms(),
      fileType: this.fileType(),
      dateRestrict: this.dateRestrict(),
    });
  }
}
