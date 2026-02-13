import { Injectable, signal, computed, effect, inject, WritableSignal, Signal } from '@angular/core';
import { Pokemon, PokemonListItem, TypeDetails, ComparisonPair } from '../models/pokemon.models';
import { PokemonService } from '../services/pokemon.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// State interface
interface PokemonState {
  pokemonList: PokemonListItem[];
  // REMOVED: filteredPokemon - This is derived state and should not be part of the core state.
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
  currentPage: number;
}

// Initial state
const initialState: PokemonState = {
  pokemonList: [],
  // REMOVED: filteredPokemon - It is now purely a computed signal.
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
  currentPage: 1,
};

@Injectable({
  providedIn: 'root',
})
export class PokemonStore {
  private pokemonService = inject(PokemonService);
  private readonly itemsPerPage = 30;
  
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
    currentPage: signal<number>(initialState.currentPage),
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
  readonly currentPage = this.state.currentPage.asReadonly();
  
  readonly filteredPokemon = computed(() => {
    const term = this.state.searchTerm().toLowerCase();
    if (!term) {
      return this.state.pokemonList();
    }
    return this.state.pokemonList().filter(p => p.name.toLowerCase().includes(term));
  });

  readonly totalPages = computed(() => {
    // Total pages should be based on the list that can be paginated.
    return Math.ceil(this.filteredPokemon().length / this.itemsPerPage);
  });

  readonly pokemonToDisplay = computed(() => {
    const listToDisplay = this.filteredPokemon();

    // Always paginate the list, whether it's filtered by search or not.
    const page = this.currentPage();
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return listToDisplay.slice(start, end);
  });

  constructor() {
    this.loadInitialPokemon();
    this.loadAllTypes();
  }
  
  // Methods to update state
  loadInitialPokemon(): void {
    this.state.loading.set(true);
    this.state.error.set(null);
    // Fetch a large list to enable full client-side search
    this.pokemonService.getPokemonList(1302).subscribe({
      next: (response) => {
        // Filter out Pokémon with IDs >= 10000, as they are alternate forms with potentially broken API endpoints.
        const filteredResults = response.results.filter(p => {
            const urlParts = p.url.split('/');
            const id = parseInt(urlParts[urlParts.length - 2], 10);
            return id < 10000;
        });
        this.state.pokemonList.set(filteredResults);
      },
      error: (err) => this.state.error.set(err.message),
      complete: () => this.state.loading.set(false),
    });
  }

  loadPokemonDetails(nameOrId: string): void {
    this.state.loading.set(true);
    this.state.error.set(null);
    this.pokemonService.getPokemonDetails(nameOrId).subscribe({
      next: (pokemon) => {
        this.state.selectedPokemon.set(pokemon);
      },
      error: (err) => {
        // Clear selected pokemon on error to prevent showing stale data
        this.state.selectedPokemon.set(null);
        this.state.error.set(err.message);
      },
      complete: () => this.state.loading.set(false),
    });
  }

  loadAllTypes(): void {
    this.state.loading.set(true);
    this.state.error.set(null);
    this.pokemonService.getAllTypes().subscribe({
      next: (types) => this.state.allTypes.set(types),
      error: (err) => this.state.error.set(err.message),
      complete: () => this.state.loading.set(false),
    });
  }

  loadTypeDetails(typeName: string): void {
    if(!typeName) {
        this.state.selectedType.set(null);
        return;
    }
    this.state.loading.set(true);
    this.state.error.set(null);
    this.pokemonService.getTypeDetails(typeName).subscribe({
        next: (typeDetails) => {
            this.state.selectedType.set(typeDetails);
        },
        error: (err) => this.state.error.set(err.message),
        complete: () => this.state.loading.set(false)
    });
  }

  setSearchTerm(term: string): void {
    this.state.searchTerm.set(term);
    this.state.currentPage.set(1); // Reset to first page on new search
  }
  
  setViewMode(mode: 'grid' | 'list'): void {
    this.state.viewMode.set(mode);
    this.state.selectedPokemon.set(null); // Clear on any view mode change for clean state
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

  // Pagination methods
  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.state.currentPage.set(page);
      window.scrollTo(0, 0);
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }
}