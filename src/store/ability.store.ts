import { Injectable, signal, computed, inject } from '@angular/core';
import { Ability, AbilityListItem } from '../models/ability.models';
import { AbilityService } from '../services/ability.service';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

interface AbilityState {
  abilityList: AbilityListItem[];
  selectedAbility: Ability | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  currentPage: number;
  totalAbilities: number;
}

const initialState: AbilityState = {
  abilityList: [],
  selectedAbility: null,
  loading: false,
  error: null,
  searchTerm: '',
  currentPage: 1,
  totalAbilities: 0,
};

@Injectable({
  providedIn: 'root',
})
export class AbilityStore {
  private abilityService = inject(AbilityService);
  private readonly itemsPerPage = 30;
  
  private state = {
    abilityList: signal<AbilityListItem[]>(initialState.abilityList),
    selectedAbility: signal<Ability | null>(initialState.selectedAbility),
    loading: signal<boolean>(initialState.loading),
    error: signal<string | null>(initialState.error),
    searchTerm: signal<string>(initialState.searchTerm),
    currentPage: signal<number>(initialState.currentPage),
    totalAbilities: signal<number>(initialState.totalAbilities),
  };

  // Selectors
  readonly abilityList = this.state.abilityList.asReadonly();
  readonly selectedAbility = this.state.selectedAbility.asReadonly();
  readonly loading = this.state.loading.asReadonly();
  readonly error = this.state.error.asReadonly();
  readonly searchTerm = this.state.searchTerm.asReadonly();
  readonly currentPage = this.state.currentPage.asReadonly();
  readonly totalAbilities = this.state.totalAbilities.asReadonly();

  readonly filteredAbilities = computed(() => {
    const term = this.state.searchTerm().toLowerCase();
    const list = this.state.abilityList();
    if (!term) {
      return list;
    }
    return list.filter(ability => ability.name.toLowerCase().includes(term));
  });
  
  readonly totalPages = computed(() => {
    // If there is a search term, we assume we've fetched the whole list
    // and pagination is client-side on the filtered results.
    // Otherwise, it's server-side based on totalAbilities.
    const term = this.state.searchTerm();
    const total = term ? this.filteredAbilities().length : this.totalAbilities();
    return Math.ceil(total / this.itemsPerPage);
  });
  
  constructor() {
    this.loadAbilities();
  }
  
  loadAbilities(): void {
    this.state.loading.set(true);
    this.state.error.set(null);
    
    // If user is searching, fetch the whole list for client-side filtering.
    // Otherwise, use pagination.
    const term = this.state.searchTerm();
    const limit = term ? 1000 : this.itemsPerPage;
    const offset = term ? 0 : (this.currentPage() - 1) * this.itemsPerPage;

    this.abilityService.getAbilityList(limit, offset).pipe(
      finalize(() => this.state.loading.set(false))
    ).subscribe({
      next: (response) => {
        this.state.abilityList.set(response.results);
        this.state.totalAbilities.set(response.count);
      },
      error: (err) => this.state.error.set(err.message),
    });
  }
  
  loadAbilityDetails(name: string): void {
      this.state.loading.set(true);
      this.state.error.set(null);
      this.state.selectedAbility.set(null);
      this.abilityService.getAbilityDetails(name).pipe(
          finalize(() => this.state.loading.set(false))
      ).subscribe({
          next: (ability) => this.state.selectedAbility.set(ability),
          error: (err) => this.state.error.set(err.message),
      });
  }
  
  setSearchTerm(term: string): void {
    const oldTerm = this.state.searchTerm();
    this.state.searchTerm.set(term);
    this.state.currentPage.set(1);
    // Reload data only if search term presence changes (from empty to non-empty or vice-versa)
    if (!!oldTerm !== !!term) {
      this.loadAbilities();
    }
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.state.currentPage.set(page);
      // Only trigger API call if not searching
      if (!this.state.searchTerm()) {
          this.loadAbilities();
      }
      window.scrollTo(0, 0);
    }
  }
}
