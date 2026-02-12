import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal, effect } from '@angular/core';
import { PokemonStore } from '../../store/pokemon.store';
import { CommonModule } from '@angular/common';
import { BattleLogicService } from '../../services/battle-logic.service';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { Pokemon } from '../../models/pokemon.models';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compare.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareComponent implements OnDestroy {
  store = inject(PokemonStore);
  battleLogic = inject(BattleLogicService);

  pokemon1Query = signal('');
  pokemon2Query = signal('');

  private searchSubject1 = new Subject<string>();
  private searchSubject2 = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.searchSubject1.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(name => {
      this.store.setPokemonForComparison(name, 1);
    });
    
    this.searchSubject2.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(name => {
      this.store.setPokemonForComparison(name, 2);
    });

    // This effect ensures the input fields are always in sync with the store's state,
    // and it resets the search stream when a slot is cleared.
    effect(() => {
      const pair = this.store.comparisonPair();

      // Sync Slot 1
      const p1Name = pair.pokemon1?.name ?? '';
      if (this.pokemon1Query() !== p1Name) {
        this.pokemon1Query.set(p1Name);
        if (p1Name === '') {
          // A clear happened (e.g., from an error or manual clear), so we must reset 
          // the search subject to allow searching for the same failed term again.
          this.searchSubject1.next('');
        }
      }

      // Sync Slot 2
      const p2Name = pair.pokemon2?.name ?? '';
      if (this.pokemon2Query() !== p2Name) {
        this.pokemon2Query.set(p2Name);
        if (p2Name === '') {
          this.searchSubject2.next('');
        }
      }
    }, { allowSignalWrites: true });
  }

  onSearch(event: Event, slot: 1 | 2) {
    const query = (event.target as HTMLInputElement).value;
    if (slot === 1) {
      this.pokemon1Query.set(query);
      this.searchSubject1.next(query);
    } else {
      this.pokemon2Query.set(query);
      this.searchSubject2.next(query);
    }
  }

  clearPokemon(slot: 1 | 2) {
    this.store.clearComparisonSlot(slot);
    // The effect will now handle clearing the query signal AND updating the subject.
  }

  changePokemon(slot: 1 | 2, direction: 'next' | 'prev') {
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
      if (currentIndex <= 0) { // If it's the first one (-1) or nothing is selected (0)
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}