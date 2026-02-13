import { ChangeDetectionStrategy, Component, inject, OnDestroy, computed, effect, signal, ViewChild, ElementRef, OnInit } from '@angular/core';
import { PokemonStore } from '../../store/pokemon.store';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PokemonListItem } from '../../models/pokemon.models';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pokemon-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonListComponent implements OnInit, OnDestroy {
  store = inject(PokemonStore);
  router = inject(Router);

  @ViewChild('gridContainer') gridContainerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('listSearchInput') listSearchInputRef?: ElementRef<HTMLInputElement>;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  activeIndex = signal(-1);
  selectedListItem = signal<PokemonListItem | null>(null);
  isKeyboardNavActive = signal(true);
  listSearchTerm = signal('');

  private handleKeyDownBound: (event: KeyboardEvent) => void;

  listToRender = computed(() => {
    const list = this.store.filteredPokemon();
    const term = this.listSearchTerm().toLowerCase();
    if (!term) {
        return list;
    }
    return list.filter(p => p.name.toLowerCase().includes(term));
  });

  constructor() {
    this.handleKeyDownBound = this.handleKeyDown.bind(this);

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.store.setSearchTerm(searchTerm);
      this.listSearchTerm.set('');
    });

    effect(() => {
      // When the displayed list changes (e.g., search, page change), reset active index
      this.store.pokemonToDisplay(); 
      this.activeIndex.set(-1);
    });
    
    effect(() => {
      // When the full filtered list changes (search), also reset selection
      this.store.filteredPokemon();
      if(this.store.viewMode() === 'list') {
          this.selectedListItem.set(null);
      }
    });

    effect(() => {
      // When the list view's own filter changes, reset selection
      this.listToRender();
      if(this.store.viewMode() === 'list') {
        this.activeIndex.set(-1);
      }
    });

    effect(() => {
      const index = this.activeIndex();
      if (index >= 0 && this.isKeyboardNavActive()) {
        const viewMode = this.store.viewMode();
        const elementId = viewMode === 'grid' ? `pokemon-item-${index}` : `pokemon-list-item-${index}`;
        setTimeout(() => {
          document.getElementById(elementId)?.scrollIntoView({ block: 'nearest' });
        }, 50);
      }
    });
  }

  ngOnInit(): void {
    document.addEventListener('keydown', this.handleKeyDownBound);
  }
  
  onMouseMove(): void {
    if (this.isKeyboardNavActive()) {
      this.isKeyboardNavActive.set(false);
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    const listSearchInputId = 'pokemon-list-internal-search';

    if ((target.id === 'pokemon-list-search' || target.id === listSearchInputId) && !['ArrowDown', 'ArrowUp', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.isKeyboardNavActive.set(false);
        return;
    }
    
    // Handle list search input navigation
    if (target.id === listSearchInputId) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            (target as HTMLElement).blur();
            this.isKeyboardNavActive.set(true);
            this.activeIndex.set(0);
        }
        return; // Exclusive handling for this input
    }
    
    const targetId = target.id || '';
    const paginationButtons = this.getPaginationButtons();
    const isPaginationFocused = paginationButtons.some(btn => btn === target);
    const isTopNavFocused = ['pokemon-list-search', 'grid-view-button', 'list-view-button'].includes(targetId);

    if (isTopNavFocused) {
        this.handleTopNav(event);
    } else if (isPaginationFocused) {
        this.handlePaginationNav(event, target, paginationButtons);
    } else if (this.store.viewMode() === 'list') {
        this.handleListNav(event);
    } else {
        this.handleGridNav(event);
    }
  }

  private handleTopNav(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const topNavElements: string[] = ['pokemon-list-search', 'grid-view-button', 'list-view-button'];
    const currentIndex = topNavElements.indexOf(target.id);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
      this.isKeyboardNavActive.set(true);
      this.activeIndex.set(0);
      return; // Exit after handling ArrowDown
    }

    if (event.key === 'ArrowRight') {
      if (currentIndex > -1 && currentIndex < topNavElements.length - 1) {
        event.preventDefault();
        document.getElementById(topNavElements[currentIndex + 1])?.focus();
      }
    } else if (event.key === 'ArrowLeft') {
      if (currentIndex > 0) {
        event.preventDefault();
        document.getElementById(topNavElements[currentIndex - 1])?.focus();
      }
    }
  }

  private handleGridNav(event: KeyboardEvent): void {
      const list = this.store.pokemonToDisplay();
      if (list.length === 0) return;

      const currentActiveIndex = this.activeIndex();
      const colCount = this.getColumnCount();

      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (arrowKeys.includes(event.key)) {
          event.preventDefault();
          this.isKeyboardNavActive.set(true);
      }
      
      if (event.key === 'Enter' || event.key === ' ') {
        if (currentActiveIndex !== -1) {
          event.preventDefault();
          const pokemon = list[currentActiveIndex];
          const pokemonId = this.getPokemonId(pokemon.url);
          this.router.navigate(['/pokemon', pokemonId]);
        }
        return;
      }

      let nextIndex = currentActiveIndex;
      if (currentActiveIndex === -1 && arrowKeys.includes(event.key)) {
        nextIndex = 0;
      } else {
        switch (event.key) {
            case 'ArrowRight': nextIndex = Math.min(list.length - 1, currentActiveIndex + 1); break;
            case 'ArrowLeft': nextIndex = Math.max(0, currentActiveIndex - 1); break;
            case 'ArrowDown':
                if (currentActiveIndex >= list.length - colCount) {
                    this.activeIndex.set(-1);
                    this.getPaginationButtons()[0]?.focus();
                    return;
                }
                nextIndex = Math.min(list.length - 1, currentActiveIndex + colCount);
                break;
            case 'ArrowUp':
                if (currentActiveIndex < colCount) {
                    this.activeIndex.set(-1);
                    this.searchInputRef?.nativeElement.focus();
                    return;
                }
                nextIndex = Math.max(0, currentActiveIndex - colCount);
                break;
        }
      }
      this.activeIndex.set(nextIndex);
  }

  private handleListNav(event: KeyboardEvent): void {
    const list = this.listToRender();
    if (list.length === 0) return;

    const currentActiveIndex = this.activeIndex();
    const arrowKeys = ['ArrowUp', 'ArrowDown'];
    if (arrowKeys.includes(event.key)) {
      event.preventDefault();
      this.isKeyboardNavActive.set(true);
    }
    
    if (event.key === 'Enter' || event.key === ' ') {
      if (currentActiveIndex !== -1) {
        event.preventDefault();
        const pokemon = list[currentActiveIndex];
        this.selectPokemon(pokemon);
      }
      return;
    }

    let nextIndex = currentActiveIndex;
    if (currentActiveIndex === -1 && arrowKeys.includes(event.key)) {
      nextIndex = 0;
    } else {
      switch (event.key) {
        case 'ArrowDown':
          nextIndex = currentActiveIndex >= list.length - 1 ? 0 : currentActiveIndex + 1;
          break;
        case 'ArrowUp':
          if (currentActiveIndex <= 0) {
            this.activeIndex.set(-1);
            this.listSearchInputRef?.nativeElement.focus();
            return;
          }
          nextIndex = currentActiveIndex - 1;
          break;
      }
    }
    this.activeIndex.set(nextIndex);
  }

  private handlePaginationNav(event: KeyboardEvent, currentTarget: HTMLElement, allButtons: HTMLElement[]): void {
    this.isKeyboardNavActive.set(true);

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      (currentTarget as HTMLElement).blur();

      const list = this.store.pokemonToDisplay();
      if (list.length > 0) {
        const colCount = this.getColumnCount();
        const lastRowStartIndex = Math.floor((list.length - 1) / colCount) * colCount;
        this.activeIndex.set(lastRowStartIndex);
      }
      return;
    }

    const currentIndex = allButtons.indexOf(currentTarget);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextButton = allButtons[Math.min(allButtons.length - 1, currentIndex + 1)];
      nextButton?.focus();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const prevButton = allButtons[Math.max(0, currentIndex - 1)];
      prevButton?.focus();
    }
  }
  
  private getPaginationButtons(): HTMLElement[] {
    const container = document.getElementById('pagination-controls');
    return container ? Array.from(container.querySelectorAll('button')) : [];
  }

  private getColumnCount(): number {
    if (!this.gridContainerRef?.nativeElement) return 5; // fallback
    return getComputedStyle(this.gridContainerRef.nativeElement).gridTemplateColumns.split(' ').length;
  }

  onSearch(event: Event) {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  onListSearch(event: Event) {
    this.listSearchTerm.set((event.target as HTMLInputElement).value);
  }

  selectPokemon(pokemon: PokemonListItem): void {
    this.selectedListItem.set(pokemon);
    const pokemonId = this.getPokemonId(pokemon.url);
    this.store.loadPokemonDetails(pokemonId);
  }

  setViewMode(mode: 'grid' | 'list') {
    this.store.setViewMode(mode);
    this.selectedListItem.set(null);
  }

  retryLoad(): void {
    this.store.loadInitialPokemon();
  }

  paginationRange = computed(() => {
    const total = this.store.totalPages(), current = this.store.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current < 5) return [1, 2, 3, 4, 5, '...', total];
    if (current > total - 4) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  });

  getPokemonId(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 2];
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = "data:image/svg+xml,%3csvg width='128' height='128' viewBox='0 0 128' 128' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='128' height='128' fill='%231e293b'/%3e%3cline x1='32' y1='32' x2='96' y2='96' stroke='%23475569' stroke-width='4'/%3e%3cline x1='96' y1='32' x2='32' y2='96' stroke='%23475569' stroke-width='4'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8' dy='-1em'%3eImage%3c/text%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8' dy='1em'%3eUnavailable%3c/text%3e%3c/svg%3e";
  }
  
  getStatPercentage(baseStat: number): number {
    return (baseStat / 255) * 100;
  }
  
  getStatColor(statName: string): string {
    switch (statName) {
      case 'hp': return 'bg-red-500';
      case 'attack': return 'bg-orange-500';
      case 'defense': return 'bg-yellow-500';
      case 'special-attack': return 'bg-blue-500';
      case 'special-defense': return 'bg-green-500';
      case 'speed': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
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

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleKeyDownBound);
    this.destroy$.next();
    this.destroy$.complete();
  }
}