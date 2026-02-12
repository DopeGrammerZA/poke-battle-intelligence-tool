import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-type-explorer',
  standalone: true,
  imports: [],
  template: `<p class="text-white">type-explorer works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeExplorerComponent {}
