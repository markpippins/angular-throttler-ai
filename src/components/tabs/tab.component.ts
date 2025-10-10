import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';

@Component({
  selector: 'app-tab',
  template: `
    <div [hidden]="!active()">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabComponent {
  title = input.required<string>();
  active = signal(false);
}