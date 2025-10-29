import { Injectable } from '@angular/core';
import { AcademicSearchResult } from '../models/academic-search-result.model.js';
import { timer, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AcademicSearchService {
  search(query: string): Promise<AcademicSearchResult[]> {
    console.log(`Simulating Academic search for: ${query}`);
    const results$ = timer(450).pipe(
      map(() => [
        {
          title: `A Comprehensive Review of the Applications of ${query}`,
          authors: ['Jane Doe', 'John Smith'],
          publication: 'Journal of Advanced Research, 2023',
          snippet: `This paper presents a systematic review of the literature on ${query}, identifying key trends, challenges, and future research directions in the field.`,
          link: '#',
        },
        {
          title: `The Economic Impact of ${query} on Modern Markets`,
          authors: ['Emily White', 'David Green'],
          publication: 'International Economic Review, 2022',
          snippet: `We analyze the macroeconomic effects of the widespread adoption of ${query}, using a dataset spanning the last decade to model its impact on GDP and employment.`,
          link: '#',
        },
        {
          title: `Ethical Considerations in the Development of ${query}`,
          authors: ['Maria Garcia'],
          publication: 'Ethics in Technology Journal, 2024',
          snippet: `This article explores the ethical dilemmas posed by ${query}, proposing a framework for responsible innovation and deployment to mitigate potential societal harms.`,
          link: '#',
        },
      ])
    );
    return firstValueFrom(results$);
  }
}
