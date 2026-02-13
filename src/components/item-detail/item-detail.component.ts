import { ChangeDetectionStrategy, Component, computed, inject, Input } from '@angular/core';
import { ItemStore } from '../../store/item.store';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Item } from '../../models/item.models';

@Component({
  selector: 'app-item-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './item-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDetailComponent {
  store = inject(ItemStore);
  private itemName: string = '';

  @Input({ required: true })
  set name(itemName: string) {
    this.itemName = itemName;
    this.store.loadItemDetails(itemName);
  }

  retryLoad(): void {
    if (this.itemName) {
      this.store.loadItemDetails(this.itemName);
    }
  }

  englishEffect = computed(() => {
    const item = this.store.selectedItem();
    if (!item) return { short: 'No effect description available.', long: '' };
    const entry = item.effect_entries.find(e => e.language.name === 'en');
    return {
      short: entry?.short_effect ?? 'No effect description available.',
      long: entry?.effect ?? '',
    };
  });
  
  englishFlavorText = computed(() => {
    const item = this.store.selectedItem();
    if (!item) return 'No flavor text available.';
    const entry = item.flavor_text_entries.find(e => e.language.name === 'en');
    return entry?.text ?? 'No flavor text available.';
  });

  getItemSprite(itemName: string): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;
  }
  
  getPokemonIdFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 2];
  }

  onImageError(event: Event, isPokemon: boolean = false) {
    // FIX: Changed size to be a number to allow arithmetic operations below.
    const size = isPokemon ? 96 : 64;
    (event.target as HTMLImageElement).src = `data:image/svg+xml,%3csvg width='${size}' height='${size}' viewBox='0 0 ${size} ${size}' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='${size}' height='${size}' fill='%231e293b'/%3e%3cpath d='M${size/3} ${size/3} L${size*2/3} ${size*2/3} M${size*2/3} ${size/3} L${size/3} ${size*2/3}' stroke='%23475569' stroke-width='2'/%3e%3c/svg%3e`;
  }
}
