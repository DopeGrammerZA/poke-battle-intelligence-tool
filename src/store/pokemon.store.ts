import { Injectable, signal, computed, effect, inject, WritableSignal, Signal } from '@angular/core';
import { Pokemon, PokemonListItem, TypeDetails, ComparisonPair } from '../models/pokemon.models';
import { PokemonService } from '../services/pokemon.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// State interface
interface PokemonState {
  pokemonList: PokemonListItem[];
  filteredPokemon: PokemonListItem[];
  selectedPokemon: Pokemon | null;
  comparisonPair: ComparisonPair;
  allTypes: {name: string, url: string}[];
  selectedType: TypeDetails | null;
  loading: boolean;
  loadingComparison: { slot1: boolean; slot2: boolean };
  error: string | null;
  comparisonError: string | null;
  searchTerm: string;
  viewMode: 'grid' | 'list';
}

// Initial state
const initialState: PokemonState = {
  pokemonList: [],
  filteredPokemon: [],
  selectedPokemon: null,
  comparisonPair: { pokemon1: null, pokemon2: null },
  allTypes: [],
  selectedType: null,
  loading: false,
  loadingComparison: { slot1: false, slot2: false },
  error: null,
  comparisonError: null,
  searchTerm: '',
  viewMode: 'grid',
};

@Injectable({
  providedIn: 'root',
})
export class PokemonStore {
  private pokemonService = inject(PokemonService);
  
  // State Signals
  private state = {
    pokemonList: signal<PokemonListItem[]>(initialState.pokemonList),
    selectedPokemon: signal<Pokemon | null>(initialState.selectedPokemon),
    comparisonPair: signal<ComparisonPair>(initialState.comparisonPair),
    allTypes: signal<{name: string, url: string}[]>(initialState.allTypes),
    selectedType: signal<TypeDetails | null>(initialState.selectedType),
    loading: signal<boolean>(initialState.loading),
    loadingComparison: signal<{ slot1: boolean; slot2: boolean }>(initialState.loadingComparison),
    error: signal<string | null>(initialState.error),
    comparisonError: signal<string | null>(initialState.comparisonError),
    searchTerm: signal<string>(initialState.searchTerm),
    viewMode: signal<'grid' | 'list'>(initialState.viewMode),
  };

  // Selectors (public computed signals)
  readonly pokemonList = this.state.pokemonList.asReadonly();
  readonly selectedPokemon = this.state.selectedPokemon.asReadonly();
  readonly comparisonPair = this.state.comparisonPair.asReadonly();
  readonly allTypes = this.state.allTypes.asReadonly();
  readonly selectedType = this.state.selectedType.asReadonly();
  readonly loading = this.state.loading.asReadonly();
  readonly loadingComparison = this.state.loadingComparison.asReadonly();
  readonly error = this.state.error.asReadonly();
  readonly comparisonError = this.state.comparisonError.asReadonly();
  readonly searchTerm = this.state.searchTerm.asReadonly();
  readonly viewMode = this.state.viewMode.asReadonly();
  
  readonly filteredPokemon = computed(() => {
    const term = this.state.searchTerm().toLowerCase();
    if (!term) {
      return this.state.pokemonList();
    }
    return this.state.pokemonList().filter(p => p.name.toLowerCase().includes(term));
  });

  constructor() {
    this.loadInitialPokemon();
    this.loadAllTypes();
  }
  
  // Methods to update state
  private loadInitialPokemon(): void {
    this.state.loading.set(true);
    this.pokemonService.getPokemonList(151).subscribe({
      next: (response) => {
        this.state.pokemonList.set(response.results);
        this.state.error.set(null);
      },
      error: (err) => this.state.error.set(err.message),
      complete: () => this.state.loading.set(false),
    });
  }

  loadPokemonDetails(name: string): void {
    this.state.loading.set(true);
    // Do not clear selectedPokemon here to allow smooth transitions in list view
    this.pokemonService.getPokemonDetails(name).subscribe({
      next: (pokemon) => {
        this.state.selectedPokemon.set(pokemon);
        this.state.error.set(null);
      },
      error: (err) => this.state.error.set(err.message),
      complete: () => this.state.loading.set(false),
    });
  }

  private loadAllTypes(): void {
    this.pokemonService.getAllTypes().subscribe({
      next: (types) => this.state.allTypes.set(types),
      error: (err) => this.state.error.set(err.message),
    });
  }

  loadTypeDetails(typeName: string): void {
    if(!typeName) {
        this.state.selectedType.set(null);
        return;
    }
    this.state.loading.set(true);
    this.pokemonService.getTypeDetails(typeName).subscribe({
        next: (typeDetails) => {
            this.state.selectedType.set(typeDetails);
            this.state.error.set(null);
        },
        error: (err) => this.state.error.set(err.message),
        complete: () => this.state.loading.set(false)
    });
  }

  setSearchTerm(term: string): void {
    this.state.searchTerm.set(term);
  }
  
  setViewMode(mode: 'grid' | 'list'): void {
    this.state.viewMode.set(mode);
    if (mode === 'grid') {
      this.state.selectedPokemon.set(null);
    }
  }

  setPokemonForComparison(pokemonName: string, slot: 1 | 2): void {
    if (!pokemonName) {
      this.clearComparisonSlot(slot);
      return;
    }

    this.state.loadingComparison.update(s => slot === 1 ? { ...s, slot1: true } : { ...s, slot2: true });
    this.state.comparisonError.set(null);

    this.pokemonService.getPokemonDetails(pokemonName).pipe(
      finalize(() => {
        this.state.loadingComparison.update(s => slot === 1 ? { ...s, slot1: false } : { ...s, slot2: false });
      })
    ).subscribe({
        next: (pokemon) => {
            this.state.comparisonPair.update(pair => {
                return slot === 1 ? { ...pair, pokemon1: pokemon } : { ...pair, pokemon2: pokemon };
            });
        },
        error: (err) => {
            this.state.comparisonError.set(err.message);
            this.clearComparisonSlot(slot);
        }
    });
  }

  clearComparisonSlot(slot: 1 | 2): void {
      this.state.comparisonPair.update(pair => {
          return slot === 1 ? { ...pair, pokemon1: null } : { ...pair, pokemon2: null };
      });
  }
}