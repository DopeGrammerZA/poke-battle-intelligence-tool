import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [],
  template: `<p class="text-white">pokemon-list works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonListComponent {}
