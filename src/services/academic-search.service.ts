import { Injectable } from '@angular/core';
import { AcademicSearchResult } from '../models/academic-search-result.model.js';

@Injectable({ providedIn: 'root' })
export class AcademicSearchService {
  private mockResults: AcademicSearchResult[] = [
    {
      title: 'Attention Is All You Need',
      authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
      publication: 'Advances in Neural Information Processing Systems',
      year: 2017,
      snippet: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable.',
      link: 'https://arxiv.org/abs/1706.03762',
      pdfLink: 'https://arxiv.org/pdf/1706.03762.pdf',
    },
    {
      title: 'Deep Residual Learning for Image Recognition',
      authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
      publication: 'CVPR',
      year: 2016,
      snippet: 'We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions.',
      link: 'https://arxiv.org/abs/1512.03385',
      pdfLink: 'https://arxiv.org/pdf/1512.03385.pdf'
    },
    {
      title: 'Mastering the game of Go with deep neural networks and tree search',
      authors: ['David Silver', 'Aja Huang', 'Chris J. Maddison', 'Arthur Guez'],
      publication: 'Nature',
      year: 2016,
      snippet: 'The game of Go has long been viewed as the most challenging of classic games for artificial intelligence. Here we introduce a new approach to computer Go that uses ‘value networks’ to evaluate board positions and ‘policy networks’ to select moves.',
      link: 'https://www.nature.com/articles/nature16961'
    }
  ];

  async search(query: string): Promise<AcademicSearchResult[]> {
    console.log(`AcademicSearchService: Searching for "${query}"`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (!query) return [];
    // Return a copy to prevent mutation
    return [...this.mockResults];
  }
}
