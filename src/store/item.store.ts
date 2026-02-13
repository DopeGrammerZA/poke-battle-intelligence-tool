import { Injectable, signal, computed, inject } from '@angular/core';
import { Item, ItemListItem } from '../models/item.models';
import { ItemService } from '../services/item.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

type ItemSortOrder = 'name-asc' | 'name-desc' | 'cost-asc' | 'cost-desc';

interface ItemState {
  itemList: Item[];
  allCategories: ItemListItem[];
  selectedItem: Item | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedCategory: string; // 'all' or a category name
  sortOrder: ItemSortOrder;
  currentPage: number;
  totalItems: number;
}

const initialState: ItemState = {
  itemList: [],
  allCategories: [],
  selectedItem: null,
  loading: false,
  error: null,
  searchTerm: '',
  selectedCategory: 'all',
  sortOrder: 'name-asc',
  currentPage: 1,
  totalItems: 0,
};

@Injectable({
  providedIn: 'root',
})
export class ItemStore {
  private itemService = inject(ItemService);
  private readonly itemsPerPage = 30;
  
  private state = {
    itemList: signal<Item[]>(initialState.itemList),
    allCategories: signal<ItemListItem[]>(initialState.allCategories),
    selectedItem: signal<Item | null>(initialState.selectedItem),
    loading: signal<boolean>(initialState.loading),
    error: signal<string | null>(initialState.error),
    searchTerm: signal<string>(initialState.searchTerm),
    selectedCategory: signal<string>(initialState.selectedCategory),
    sortOrder: signal<ItemSortOrder>(initialState.sortOrder),
    currentPage: signal<number>(initialState.currentPage),
    totalItems: signal<number>(initialState.totalItems),
  };

  // Selectors
  readonly itemList = this.state.itemList.asReadonly();
  readonly allCategories = this.state.allCategories.asReadonly();
  readonly selectedItem = this.state.selectedItem.asReadonly();
  readonly loading = this.state.loading.asReadonly();
  readonly error = this.state.error.asReadonly();
  readonly searchTerm = this.state.searchTerm.asReadonly();
  readonly selectedCategory = this.state.selectedCategory.asReadonly();
  readonly sortOrder = this.state.sortOrder.asReadonly();
  readonly currentPage = this.state.currentPage.asReadonly();
  readonly totalItems = this.state.totalItems.asReadonly();
  
  readonly filteredAndSortedItems = computed(() => {
    const term = this.state.searchTerm().toLowerCase();
    const sortOrder = this.state.sortOrder();
    
    const filtered = !term
      ? this.state.itemList()
      : this.state.itemList().filter(item => item.name.toLowerCase().includes(term));

    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'cost-asc': return a.cost - b.cost;
        case 'cost-desc': return b.cost - a.cost;
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'name-asc':
        default: return a.name.localeCompare(b.name);
      }
    });
  });

  readonly totalPages = computed(() => {
    // If a category is selected, pagination is client-side on the filtered list.
    if (this.selectedCategory() !== 'all') {
      return Math.ceil(this.filteredAndSortedItems().length / this.itemsPerPage);
    }
    // Otherwise, it's server-side
    return Math.ceil(this.totalItems() / this.itemsPerPage);
  });

  readonly paginatedItems = computed(() => {
    const items = this.filteredAndSortedItems();
    // For server-side pagination ('all' category), the list is already the correct page.
    if (this.selectedCategory() === 'all') {
      return items;
    }
    // For client-side pagination (specific category), we slice the full list.
    const page = this.currentPage();
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return items.slice(start, end);
  });

  constructor() {
    this.loadAllCategories();
    this.loadItems(); 
  }
  
  loadItems(): void {
    this.state.loading.set(true);
    this.state.error.set(null);
    const category = this.selectedCategory();

    if (category === 'all') {
      // Server-side pagination
      const offset = (this.currentPage() - 1) * this.itemsPerPage;
      this.itemService.getItemList(this.itemsPerPage, offset).pipe(
        finalize(() => this.state.loading.set(false))
      ).subscribe({
        next: (response) => {
            this.state.totalItems.set(response.count);
            const detailRequests = response.results.map(item => 
                this.itemService.getItemDetailsByUrl(item.url).pipe(
                    catchError(() => of(null)) // Handle errors for individual items
                )
            );
            forkJoin(detailRequests).subscribe(items => {
                this.state.itemList.set(items.filter((i): i is Item => i !== null));
            });
        },
        error: (err) => this.state.error.set(err.message),
      });
    } else {
      // Client-side pagination (load all for category)
      this.itemService.getCategoryDetails(category).pipe(
          finalize(() => this.state.loading.set(false))
      ).subscribe({
        next: (categoryDetails) => {
            this.state.totalItems.set(categoryDetails.items.length);
            const detailRequests = categoryDetails.items.map(item => 
                this.itemService.getItemDetailsByUrl(item.url).pipe(
                    catchError(() => of(null))
                )
            );
            forkJoin(detailRequests).subscribe(items => {
                this.state.itemList.set(items.filter((i): i is Item => i !== null));
            });
        },
        error: (err) => this.state.error.set(err.message),
      });
    }
  }

  loadAllCategories(): void {
    this.itemService.getAllItemCategories().subscribe({
        next: (response) => this.state.allCategories.set(response.results),
        error: (err) => this.state.error.set(err.message)
    });
  }

  loadItemDetails(name: string): void {
      this.state.loading.set(true);
      this.state.error.set(null);
      this.state.selectedItem.set(null);
      this.itemService.getItemDetails(name).pipe(
          finalize(() => this.state.loading.set(false))
      ).subscribe({
          next: (item) => this.state.selectedItem.set(item),
          error: (err) => this.state.error.set(err.message),
      });
  }

  setSearchTerm(term: string): void {
    this.state.searchTerm.set(term);
    this.state.currentPage.set(1);
  }

  setCategory(categoryName: string): void {
    this.state.selectedCategory.set(categoryName);
    this.state.currentPage.set(1);
    this.state.searchTerm.set('');
    this.loadItems();
  }

  setSortOrder(order: ItemSortOrder): void {
    this.state.sortOrder.set(order);
    this.state.currentPage.set(1);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.state.currentPage.set(page);
      if (this.selectedCategory() === 'all') {
          this.loadItems();
      }
      window.scrollTo(0, 0);
    }
  }
}
