import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PokemonStore } from '../../store/pokemon.store';
import { PokemonService } from '../../services/pokemon.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
// FIX: Import `of` and `forkJoin` from RxJS, and `catchError` and `finalize` from `rxjs/operators` to gracefully handle API errors within streams.
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
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
  isFindingApex = signal<boolean>(false);
  findApexError = signal<string | null>(null);
  private lastSelectedTypeName: string = '';

  selectedTypeName = computed(() => this.store.selectedType()?.name);
  
  onTypeChange(event: Event): void {
    const typeName = (event.target as HTMLSelectElement).value;
    this.lastSelectedTypeName = typeName;
    this.apexPokemon.set(null); // Reset apex pokemon when type changes
    this.findApexError.set(null);
    this.store.loadTypeDetails(typeName);
  }

  retryLoad(): void {
    if (this.lastSelectedTypeName) {
        this.store.loadTypeDetails(this.lastSelectedTypeName);
    } else {
        this.store.loadAllTypes();
    }
  }

  findApexPokemon(pokemonList: { pokemon: PokemonListItem }[]): void {
      if (!pokemonList || pokemonList.length === 0) {
          this.apexPokemon.set(null);
          return;
      }

      this.isFindingApex.set(true);
      this.findApexError.set(null);
      
      const pokemonDetails$ = pokemonList.slice(0, 50).map(p => 
        this.pokemonService.getPokemonDetails(p.pokemon.name).pipe(
          catchError(err => {
              console.warn(`Could not fetch details for ${p.pokemon.name}, skipping.`, err.message);
              return of(null); // Return null on error so forkJoin doesn't fail
          })
        )
      );

      forkJoin(pokemonDetails$).pipe(
          finalize(() => this.isFindingApex.set(false))
      ).subscribe({
          next: (pokemons) => { // pokemons is (Pokemon | null)[]
              const validPokemons = pokemons.filter((p): p is Pokemon => p !== null);

              if (validPokemons.length === 0) {
                this.findApexError.set("Could not find details for any Pokémon in this type group.");
                this.apexPokemon.set(null);
                return;
              }

              let apex: ApexPokemon | null = null;
              for (const p of validPokemons) {
                  const totalStats = p.stats.reduce((sum, s) => sum + s.base_stat, 0);
                  if (!apex || totalStats > apex.totalStats) {
                      apex = { ...p, totalStats };
                  }
              }
              this.apexPokemon.set(apex);
          },
          error: (err) => {
              // This block should now only be hit by unexpected errors, not 404s.
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

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = "data:image/svg+xml,%3csvg width='128' height='128' viewBox='0 0 128' 128' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='128' height='128' fill='%231e293b'/%3e%3cline x1='32' y1='32' x2='96' y2='96' stroke='%23475569' stroke-width='4'/%3e%3cline x1='96' y1='32' x2='32' y2='96' stroke='%23475569' stroke-width='4'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8' dy='-1em'%3eImage%3c/text%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8' dy='1em'%3eUnavailable%3c/text%3e%3c/svg%3e";
  }
}