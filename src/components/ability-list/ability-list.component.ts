import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy } from '@angular/core';
import { AbilityStore } from '../../store/ability.store';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-ability-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './ability-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilityListComponent implements OnDestroy {
  store = inject(AbilityStore);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.store.setSearchTerm(searchTerm);
    });
  }

  onSearch(event: Event) {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  retryLoad(): void {
    this.store.loadAbilities();
  }

  paginationRange = computed(() => {
    const total = this.store.totalPages(), current = this.store.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current < 5) return [1, 2, 3, 4, 5, '...', total];
    if (current > total - 4) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  });
  
  paginatedAbilities = computed(() => {
    const list = this.store.filteredAbilities();
    // If searching, paginate the client-side filtered list
    if (this.store.searchTerm()) {
        const page = this.store.currentPage();
        const start = (page - 1) * 30; // 30 items per page
        const end = start + 30;
        return list.slice(start, end);
    }
    // Otherwise, the list from the store is already the correct page from the API
    return list;
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
