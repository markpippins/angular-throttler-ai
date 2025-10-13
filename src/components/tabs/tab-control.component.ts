import { Component, ChangeDetectionStrategy, contentChildren, signal, AfterContentInit, effect, output } from '@angular/core';
import { TabComponent } from './tab.component.js';

@Component({
  selector: 'app-tab-control',
  templateUrl: './tab-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabControlComponent implements AfterContentInit {
  tabs = contentChildren(TabComponent);
  activeTabIndex = signal(0);
  collapseClick = output<void>();

  constructor() {
    effect(() => {
        this.updateActiveTabs(this.activeTabIndex());
    });
  }

  ngAfterContentInit() {
    this.updateActiveTabs(this.activeTabIndex());
  }
  
  selectTab(index: number) {
    this.activeTabIndex.set(index);
  }

  private updateActiveTabs(activeIndex: number) {
    this.tabs().forEach((tab, i) => {
      tab.active.set(i === activeIndex);
    });
  }
}
