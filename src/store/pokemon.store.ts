import { Injectable, signal, computed, effect, inject, WritableSignal, Signal } from '@angular/core';
import { Pokemon, PokemonListItem, TypeDetails, ComparisonPair, EvolutionChain } from '../models/pokemon.models';
import { PokemonService } from '../services/pokemon.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, mergeMap } from 'rxjs/operators';

type SortOrder = 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc';

// State interface
interface PokemonState {
  pokemonList: PokemonListItem[];
  selectedPokemon: Pokemon | null;
  comparisonPair: ComparisonPair;
  allTypes: {name: string, url: string}[];
  selectedType: TypeDetails | null;
  evolutionChain: EvolutionChain | null;
  loading: boolean;
  loadingComparison: { slot1: boolean; slot2: boolean };
  loadingEvolution: boolean;
  error: string | null;
  comparisonError: string | null;
  evolutionError: string | null;
  searchTerm: string;
  viewMode: 'grid' | 'list';
  currentPage: number;
  sortOrder: SortOrder;
}

// Initial state
const initialState: PokemonState = {
  pokemonList: [],
  selectedPokemon: null,
  comparisonPair: { pokemon1: null, pokemon2: null },
  allTypes: [],
  selectedType: null,
  evolutionChain: null,
  loading: false,
  loadingComparison: { slot1: false, slot2: false },
  loadingEvolution: false,
  error: null,
  comparisonError: null,
  evolutionError: null,
  searchTerm: '',
  viewMode: 'grid',
  currentPage: 1,
  sortOrder: 'id-asc',
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
    evolutionChain: signal<EvolutionChain | null>(initialState.evolutionChain),
    loading: signal<boolean>(initialState.loading),
    loadingComparison: signal<{ slot1: boolean; slot2: boolean }>(initialState.loadingComparison),
    loadingEvolution: signal<boolean>(initialState.loadingEvolution),
    error: signal<string | null>(initialState.error),
    comparisonError: signal<string | null>(initialState.comparisonError),
    evolutionError: signal<string | null>(initialState.evolutionError),
    searchTerm: signal<string>(initialState.searchTerm),
    viewMode: signal<'grid' | 'list'>(initialState.viewMode),
    currentPage: signal<number>(initialState.currentPage),
    sortOrder: signal<SortOrder>(initialState.sortOrder),
  };

  // Selectors (public computed signals)
  readonly pokemonList = this.state.pokemonList.asReadonly();
  readonly selectedPokemon = this.state.selectedPokemon.asReadonly();
  readonly comparisonPair = this.state.comparisonPair.asReadonly();
  readonly allTypes = this.state.allTypes.asReadonly();
  readonly selectedType = this.state.selectedType.asReadonly();
  readonly evolutionChain = this.state.evolutionChain.asReadonly();
  readonly loading = this.state.loading.asReadonly();
  readonly loadingComparison = this.state.loadingComparison.asReadonly();
  readonly loadingEvolution = this.state.loadingEvolution.asReadonly();
  readonly error = this.state.error.asReadonly();
  readonly comparisonError = this.state.comparisonError.asReadonly();
  readonly evolutionError = this.state.evolutionError.asReadonly();
  readonly searchTerm = this.state.searchTerm.asReadonly();
  readonly viewMode = this.state.viewMode.asReadonly();
  readonly currentPage = this.state.currentPage.asReadonly();
  readonly sortOrder = this.state.sortOrder.asReadonly();
  
  readonly filteredPokemon = computed(() => {
    const term = this.state.searchTerm().toLowerCase();
    const sortOrder = this.state.sortOrder();

    const filtered = !term
      ? this.state.pokemonList()
      : this.state.pokemonList().filter(p => p.name.toLowerCase().includes(term));
    
    // Helper to get ID
    const getPokemonId = (url: string): number => {
        const parts = url.split('/');
        return parseInt(parts[parts.length - 2], 10);
    };

    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'id-desc':
          return getPokemonId(b.url) - getPokemonId(a.url);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'id-asc':
        default:
          return getPokemonId(a.url) - getPokemonId(b.url);
      }
    });
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
    this.state.selectedPokemon.set(null); // Clear previous selection
    this.pokemonService.getPokemonDetails(nameOrId).pipe(
      finalize(() => this.state.loading.set(false))
    ).subscribe({
      next: (pokemon) => {
        this.state.selectedPokemon.set(pokemon);
      },
      error: (err) => {
        // No need to clear selectedPokemon here as it's cleared at the start
        this.state.error.set(err.message);
      }
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

  loadEvolutionChain(pokemonName: string): void {
    this.state.loadingEvolution.set(true);
    this.state.evolutionError.set(null);
    this.state.evolutionChain.set(null);

    this.pokemonService.getPokemonSpecies(pokemonName).pipe(
        mergeMap(species => this.pokemonService.getEvolutionChainByUrl(species.evolution_chain.url)),
        finalize(() => this.state.loadingEvolution.set(false))
    ).subscribe({
        next: (chain) => this.state.evolutionChain.set(chain),
        error: (err) => this.state.evolutionError.set(err.message),
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

  setSortOrder(order: SortOrder): void {
    this.state.sortOrder.set(order);
    this.state.currentPage.set(1);
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