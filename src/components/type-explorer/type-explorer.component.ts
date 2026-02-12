import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PokemonStore } from '../../store/pokemon.store';
import { PokemonService } from '../../services/pokemon.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
// FIX: Import `finalize` operator from RxJS and remove unused operators.
import { forkJoin, finalize } from 'rxjs';
import { Pokemon, PokemonListItem } from '../../models/pokemon.models';

interface ApexPokemon extends Pokemon {
  totalStats: number;
}

@Component({
  selector: 'app-type-explorer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './type-explorer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeExplorerComponent {
  store = inject(PokemonStore);
  pokemonService = inject(PokemonService);
  
  apexPokemon = signal<ApexPokemon | null>(null);
  // FIX: Use component-local signals for loading and error states for the findApexPokemon action,
  // as the store's signals are readonly and should not be modified from a component.
  isFindingApex = signal<boolean>(false);
  findApexError = signal<string | null>(null);

  selectedTypeName = computed(() => this.store.selectedType()?.name);
  
  onTypeChange(event: Event): void {
    const typeName = (event.target as HTMLSelectElement).value;
    this.apexPokemon.set(null); // Reset apex pokemon when type changes
    // FIX: Reset local error state as well.
    this.findApexError.set(null);
    this.store.loadTypeDetails(typeName);
  }

  findApexPokemon(pokemonList: { pokemon: PokemonListItem }[]): void {
      if (!pokemonList || pokemonList.length === 0) {
          this.apexPokemon.set(null);
          return;
      }

      // FIX: Set local loading and error states.
      this.isFindingApex.set(true);
      this.findApexError.set(null);
      
      const pokemonDetails$ = pokemonList.slice(0, 50).map(p => this.pokemonService.getPokemonDetails(p.pokemon.name));

      // FIX: Use the `finalize` operator to ensure the loading state is reset
      // whether the observable completes or errors. This replaces direct mutation
      // of the store's readonly signals.
      forkJoin(pokemonDetails$).pipe(
          finalize(() => this.isFindingApex.set(false))
      ).subscribe({
          next: (pokemons) => {
              let apex: ApexPokemon | null = null;
              for (const p of pokemons) {
                  const totalStats = p.stats.reduce((sum, s) => sum + s.base_stat, 0);
                  if (!apex || totalStats > apex.totalStats) {
                      apex = { ...p, totalStats };
                  }
              }
              this.apexPokemon.set(apex);
          },
          error: (err) => {
              // FIX: Set local error state.
              this.findApexError.set(err.message);
          }
      });
  }

  getPokemonId(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 2];
  }
  
   getTypeColor(typeName: string): string {
    const colors: { [key: string]: string } = {
        normal: 'bg-gray-400 border-gray-400', fire: 'bg-red-500 border-red-500', water: 'bg-blue-500 border-blue-500',
        electric: 'bg-yellow-400 border-yellow-400', grass: 'bg-green-500 border-green-500', ice: 'bg-cyan-300 border-cyan-300 text-black',
        fighting: 'bg-orange-700 border-orange-700', poison: 'bg-purple-600 border-purple-600', ground: 'bg-yellow-600 border-yellow-600',
        flying: 'bg-indigo-400 border-indigo-400', psychic: 'bg-pink-500 border-pink-500', bug: 'bg-lime-500 border-lime-500',
        rock: 'bg-yellow-700 border-yellow-700', ghost: 'bg-indigo-800 border-indigo-800', dragon: 'bg-indigo-600 border-indigo-600',
        dark: 'bg-gray-800 border-gray-800', steel: 'bg-gray-500 border-gray-500', fairy: 'bg-pink-300 border-pink-300 text-black',
    };
    return colors[typeName] || 'bg-gray-200 border-gray-200';
  }
}
