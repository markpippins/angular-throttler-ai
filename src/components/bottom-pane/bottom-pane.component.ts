import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabControlComponent } from '../tabs/tab-control.component.js';
import { TabComponent } from '../tabs/tab.component.js';
import { WebSearchResultsComponent } from '../web-search-results/web-search-results.component.js';
import { ImageSearchResultsComponent } from '../image-search-results/image-search-results.component.js';
import { GeminiSearchResultsComponent } from '../gemini-search-results/gemini-search-results.component.js';

@Component({
  selector: 'app-bottom-pane',
  imports: [CommonModule, TabControlComponent, TabComponent, WebSearchResultsComponent, ImageSearchResultsComponent, GeminiSearchResultsComponent],
  templateUrl: './bottom-pane.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomPaneComponent {}