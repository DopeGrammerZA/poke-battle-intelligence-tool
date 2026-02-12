import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [],
  template: `<p class="text-white">compare works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareComponent {}
