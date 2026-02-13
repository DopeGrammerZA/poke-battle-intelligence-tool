import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy } from '@angular/core';
import { ItemStore } from '../../store/item.store';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-item-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './item-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemListComponent implements OnDestroy {
  store = inject(ItemStore);

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

  onCategoryChange(event: Event) {
    const categoryName = (event.target as HTMLSelectElement).value;
    this.store.setCategory(categoryName);
  }

  onSortChange(event: Event) {
    const sortOrder = (event.target as HTMLSelectElement).value as 'name-asc' | 'name-desc' | 'cost-asc' | 'cost-desc';
    this.store.setSortOrder(sortOrder);
  }

  retryLoad(): void {
    this.store.loadItems();
  }

  paginationRange = computed(() => {
    const total = this.store.totalPages(), current = this.store.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current < 5) return [1, 2, 3, 4, 5, '...', total];
    if (current > total - 4) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  });

  getItemSprite(itemName: string): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = "data:image/svg+xml,%3csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='64' height='64' fill='%231e293b'/%3e%3cpath d='M24 24 L40 40 M40 24 L24 40' stroke='%23475569' stroke-width='2'/%3e%3c/svg%3e";
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
