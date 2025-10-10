import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FileExplorerComponent } from './components/file-explorer/file-explorer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileExplorerComponent],
})
export class AppComponent {}
