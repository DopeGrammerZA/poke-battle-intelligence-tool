import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { PokemonStore } from '../../store/pokemon.store';
import { CommonModule } from '@angular/common';
import { BattleLogicService } from '../../services/battle-logic.service';
import { Pokemon } from '../../models/pokemon.models';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compare.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onClickOutside($event)',
  },
})
export class CompareComponent {
  store = inject(PokemonStore);
  battleLogic = inject(BattleLogicService);

  @ViewChild('dropdownContainer1') dropdownContainer1Ref?: ElementRef<HTMLDivElement>;
  @ViewChild('dropdownContainer2') dropdownContainer2Ref?: ElementRef<HTMLDivElement>;

  private query1 = signal('');
  private query2 = signal('');

  isDropdown1Open = signal(false);
  isDropdown2Open = signal(false);

  filteredPokemon1 = computed(() => {
    const q = this.query1().toLowerCase();
    if (!q) return this.store.pokemonList();
    return this.store.pokemonList().filter(p => p.name.toLowerCase().includes(q));
  });

  filteredPokemon2 = computed(() => {
    const q = this.query2().toLowerCase();
    if (!q) return this.store.pokemonList();
    return this.store.pokemonList().filter(p => p.name.toLowerCase().includes(q));
  });

  onClickOutside(event: Event): void {
    const target = event.target as Node;
    if (this.isDropdown1Open() && this.dropdownContainer1Ref && !this.dropdownContainer1Ref.nativeElement.contains(target)) {
      this.isDropdown1Open.set(false);
    }
    if (this.isDropdown2Open() && this.dropdownContainer2Ref && !this.dropdownContainer2Ref.nativeElement.contains(target)) {
      this.isDropdown2Open.set(false);
    }
  }

  onQueryChange(event: Event, slot: 1 | 2): void {
    const query = (event.target as HTMLInputElement).value;
    if (slot === 1) {
      this.query1.set(query);
    } else {
      this.query2.set(query);
    }
  }

  toggleDropdown(slot: 1 | 2): void {
    if (slot === 1) {
      this.isDropdown1Open.update(v => !v);
      if (this.isDropdown1Open()) this.isDropdown2Open.set(false);
    } else {
      this.isDropdown2Open.update(v => !v);
      if (this.isDropdown2Open()) this.isDropdown1Open.set(false);
    }
  }
  
  selectPokemon(pokemonName: string, slot: 1 | 2): void {
    this.store.setPokemonForComparison(pokemonName, slot);
    if (slot === 1) {
      this.isDropdown1Open.set(false);
    } else {
      this.isDropdown2Open.set(false);
    }
  }

  changePokemon(slot: 1 | 2, direction: 'next' | 'prev'): void {
    const pokemonList = this.store.pokemonList();
    if (pokemonList.length === 0) {
      return;
    }

    const currentPair = this.store.comparisonPair();
    const currentPokemon = slot === 1 ? currentPair.pokemon1 : currentPair.pokemon2;

    let currentIndex = -1;
    if (currentPokemon) {
      currentIndex = pokemonList.findIndex(p => p.name === currentPokemon.name);
    }

    let nextIndex: number;

    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % pokemonList.length;
    } else { // 'prev'
      if (currentIndex <= 0) { // If it's the first one or nothing is selected (-1)
        nextIndex = pokemonList.length - 1;
      } else {
        nextIndex = currentIndex - 1;
      }
    }

    const nextPokemonName = pokemonList[nextIndex].name;
    this.store.setPokemonForComparison(nextPokemonName, slot);
  }

  winnerPrediction = computed(() => {
    const pair = this.store.comparisonPair();
    if (pair.pokemon1 && pair.pokemon2) {
      return this.battleLogic.predictWinner(pair.pokemon1, pair.pokemon2);
    }
    return null;
  });
  
  getStatValue(pokemon: Pokemon, statName: string): number {
      return pokemon.stats.find(s => s.stat.name === statName)?.base_stat ?? 0;
  }

  getTypeColor(typeName: string): string {
    const colors: { [key: string]: string } = {
        normal: 'bg-gray-400', fire: 'bg-red-500', water: 'bg-blue-500',
        electric: 'bg-yellow-400', grass: 'bg-green-500', ice: 'bg-cyan-300 text-black',
        fighting: 'bg-orange-700', poison: 'bg-purple-600', ground: 'bg-yellow-600',
        flying: 'bg-indigo-400', psychic: 'bg-pink-500', bug: 'bg-lime-500',
        rock: 'bg-yellow-700', ghost: 'bg-indigo-800', dragon: 'bg-indigo-600',
        dark: 'bg-gray-800', steel: 'bg-gray-500', fairy: 'bg-pink-300 text-black',
    };
    return colors[typeName] || 'bg-gray-200';
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = "data:image/svg+xml,%3csvg width='128' height='128' viewBox='0 0 128' 128' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='128' height='128' fill='%231e293b'/%3e%3cline x1='32' y1='32' x2='96' y2='96' stroke='%23475569' stroke-width='4'/%3e%3cline x1='96' y1='32' x2='32' y2='96' stroke='%23475569' stroke-width='4'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8' dy='-1em'%3eImage%3c/text%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8' dy='1em'%3eUnavailable%3c/text%3e%3c/svg%3e";
  }
}