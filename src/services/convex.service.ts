import { Injectable } from '@angular/core';
import { Magnet } from '../models/magnet.model';

@Injectable({
  providedIn: 'root',
})
export class ConvexService {
  private mockMagnets: Magnet[] = [
    {
      _id: '1',
      _creationTime: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
      folderName: 'tech_reports',
      displayName: 'Q1 AI Research Summary',
      tags: 'AI, Research, Quarterly Report',
    },
    {
      _id: '2',
      _creationTime: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
      folderName: 'marketing_assets',
      displayName: 'Summer Campaign Images',
      tags: 'Marketing, Images, Summer 2024',
    },
    {
      _id: '3',
      _creationTime: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      folderName: 'project_alpha',
      displayName: 'Alpha Project Plan',
      tags: 'Project Alpha, Planning, Documents',
    },
    {
        _id: '4',
        _creationTime: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
        folderName: 'legal_docs',
        displayName: 'NDA Template',
        tags: 'Legal, Templates',
    },
    {
        _id: '5',
        _creationTime: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
        folderName: 'tech_reports',
        displayName: 'Frontend Performance Analysis',
        tags: 'Frontend, Performance, Research',
    },
    {
        _id: '6',
        _creationTime: Date.now(),
        folderName: 'uncategorized',
        displayName: 'Meeting Notes',
        tags: '',
    }
  ];

  /**
   * Searches magnets based on a query. This is a mock implementation.
   * A real implementation would make an API call to a Convex backend.
   * @param query The search query string.
   * @returns A promise that resolves to an array of matching magnets.
   */
  async searchMagnets(query: string): Promise<Magnet[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    if (!query) {
      return [...this.mockMagnets];
    }

    const lowerCaseQuery = query.toLowerCase();
    return this.mockMagnets.filter(magnet =>
      magnet.displayName.toLowerCase().includes(lowerCaseQuery) ||
      magnet.folderName.toLowerCase().includes(lowerCaseQuery) ||
      magnet.tags.toLowerCase().includes(lowerCaseQuery)
    );
  }
}
