import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [],
  template: `<p class="text-white">pokemon-detail works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailComponent {}
