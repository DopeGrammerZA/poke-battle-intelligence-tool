import { ChangeDetectionStrategy, Component, inject, OnDestroy, computed, effect, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { PokemonStore } from '../../store/pokemon.store';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { BattleLogicService } from '../../services/battle-logic.service';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pokemon-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown)': 'handleKeyDown($event)',
    'tabindex': '0',
    'class': 'focus:outline-none block'
  }
})
export class PokemonListComponent implements OnDestroy, AfterViewInit {
  store = inject(PokemonStore);
  battleLogic = inject(BattleLogicService);
  router = inject(Router);
  elementRef = inject(ElementRef);

  @ViewChild('gridContainer') gridContainerRef?: ElementRef<HTMLDivElement>;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  activeIndex = signal(-1);
  isKeyboardNavActive = signal(true); // Start with keyboard nav enabled

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.store.setSearchTerm(searchTerm);
    });

    // Effect to handle view mode changes
    effect(() => {
      const view = this.store.viewMode();
      const list = this.store.filteredPokemon();
      const selected = this.store.selectedPokemon();

      if (view === 'list' && list.length > 0 && !selected) {
        // If switching to list view and nothing is selected, select the first item.
        this.store.loadPokemonDetails(list[0].name);
      }
    });

    // Effect to reset active index when search term changes
    effect(() => {
      this.store.filteredPokemon(); // depend on this signal
      this.activeIndex.set(-1);
    });

    // Effect to scroll the active item into view
    effect(() => {
      const index = this.activeIndex();
      if (index < 0 || !this.isKeyboardNavActive()) return;

      // Use timeout to allow DOM to update after index change
      setTimeout(() => {
        const activeElement = document.getElementById(`pokemon-item-${index}`);
        activeElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    });
  }

  ngAfterViewInit(): void {
    // Use a timeout to ensure focus is set after the view is fully rendered and stable.
    // preventScroll avoids the page jumping if the component is not at the top.
    setTimeout(() => this.elementRef.nativeElement.focus({ preventScroll: true }), 0);
  }

  onMouseMove(): void {
    // When the mouse is used, disable keyboard navigation highlight
    if (this.isKeyboardNavActive()) {
      this.isKeyboardNavActive.set(false);
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if ((event.target as HTMLElement).tagName === 'INPUT') {
      return;
    }

    const list = this.store.filteredPokemon();
    if (list.length === 0) return;
    
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    
    // When an arrow key is pressed, re-enable keyboard navigation if it was disabled.
    if (arrowKeys.includes(event.key)) {
      if (!this.isKeyboardNavActive()) {
        this.isKeyboardNavActive.set(true);
      }
    }

    if ([...arrowKeys, 'Enter'].includes(event.key)) {
        event.preventDefault();
    }

    const currentActiveIndex = this.activeIndex();
    const listSize = list.length;
    let nextIndex = currentActiveIndex;

    if (event.key === 'Enter') {
        if (currentActiveIndex !== -1) {
            const pokemon = list[currentActiveIndex];
            if (this.store.viewMode() === 'grid') {
                this.router.navigate(['/pokemon', pokemon.name]);
            } else {
                this.selectPokemon(pokemon.name);
            }
        }
        return;
    }

    if (currentActiveIndex === -1) {
        // When no item is selected, any arrow key press should select the first item.
        if (arrowKeys.includes(event.key)) {
            nextIndex = 0;
        }
    } else {
        const isListView = this.store.viewMode() === 'list';

        if (isListView) {
            // Simplified logic for single-column list view
            switch (event.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    nextIndex = currentActiveIndex + 1;
                    if (nextIndex >= listSize) nextIndex = 0; // Wrap to start
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                    nextIndex = currentActiveIndex - 1;
                    if (nextIndex < 0) nextIndex = listSize - 1; // Wrap to end
                    break;
            }
        } else {
            // Original logic for grid view
            const colCount = this.getColumnCount();
            switch (event.key) {
                case 'ArrowRight':
                    nextIndex = currentActiveIndex + 1;
                    if (nextIndex >= listSize) nextIndex = 0;
                    break;
                case 'ArrowLeft':
                    nextIndex = currentActiveIndex - 1;
                    if (nextIndex < 0) nextIndex = listSize - 1;
                    break;
                case 'ArrowDown':
                    nextIndex = currentActiveIndex + colCount;
                    if (nextIndex >= listSize) {
                        nextIndex = (currentActiveIndex % colCount);
                         if (nextIndex >= listSize) { 
                            nextIndex = listSize - 1;
                        }
                    }
                    break;
                case 'ArrowUp':
                    nextIndex = currentActiveIndex - colCount;
                    if (nextIndex < 0) {
                        const col = currentActiveIndex % colCount;
                        let lastInCol = listSize - 1 - ((listSize - 1) % colCount) + col;
                        while (lastInCol >= listSize) {
                            lastInCol -= colCount;
                        }
                        nextIndex = lastInCol;
                    }
                    break;
            }
        }
    }

    if (nextIndex !== this.activeIndex()) {
        this.activeIndex.set(nextIndex);
    }
  }

  private getColumnCount(): number {
    if (this.store.viewMode() === 'list') {
        return 1;
    }
    if (this.gridContainerRef?.nativeElement) {
        const grid = this.gridContainerRef.nativeElement;
        const colCount = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
        return colCount > 0 ? colCount : 1;
    }
    // Fallback based on typical screen size if ref isn't ready
    if (window.innerWidth >= 1280) return 6;
    if (window.innerWidth >= 1024) return 5;
    if (window.innerWidth >= 768) return 4;
    if (window.innerWidth >= 640) return 3;
    return 2;
  }

  onSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchSubject.next(inputElement.value);
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.store.setViewMode(mode);
  }

  selectPokemon(name: string): void {
    this.store.loadPokemonDetails(name);
    const index = this.store.filteredPokemon().findIndex(p => p.name === name);
    this.activeIndex.set(index);
  }

  battleReadinessScore = computed(() => {
    const p = this.store.selectedPokemon();
    return p ? this.battleLogic.calculateBattleReadinessScore(p) : 0;
  });

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

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-neon-mint';
    if (score >= 60) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPokemonId(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 2];
  }
}