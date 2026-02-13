import { ChangeDetectionStrategy, Component, computed, inject, Input } from '@angular/core';
import { AbilityStore } from '../../store/ability.store';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ability-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './ability-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilityDetailComponent {
  store = inject(AbilityStore);
  private abilityName: string = '';

  @Input({ required: true })
  set name(abilityName: string) {
    this.abilityName = abilityName;
    this.store.loadAbilityDetails(abilityName);
  }

  retryLoad(): void {
    if (this.abilityName) {
      this.store.loadAbilityDetails(this.abilityName);
    }
  }

  englishEffect = computed(() => {
    const ability = this.store.selectedAbility();
    if (!ability) return 'No effect description available.';
    const entry = ability.effect_entries.find(e => e.language.name === 'en');
    return entry?.effect ?? 'No effect description available.';
  });
  
  englishFlavorText = computed(() => {
    const ability = this.store.selectedAbility();
    if (!ability) return 'No flavor text available.';
    // Find a recent English flavor text
    const entry = [...ability.flavor_text_entries].reverse().find(e => e.language.name === 'en');
    return entry?.flavor_text ?? 'No flavor text available.';
  });

  getPokemonIdFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 2];
  }
  
  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = `data:image/svg+xml,%3csvg width='96' height='96' viewBox='0 0 96 96' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='96' height='96' fill='%231e293b'/%3e%3cpath d='M32 32 L64 64 M64 32 L32 64' stroke='%23475569' stroke-width='2'/%3e%3c/svg%3e`;
  }
}
