import { ChangeDetectionStrategy, Component, computed, inject, Input } from '@angular/core';
import { PokemonStore } from '../../store/pokemon.store';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BattleLogicService } from '../../services/battle-logic.service';

@Component({
  selector: 'app-pokemon-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './pokemon-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailComponent {
  store = inject(PokemonStore);
  battleLogic = inject(BattleLogicService);

  private pokemonId: string = '';

  @Input({ required: true })
  set id(pokemonId: string) {
    this.pokemonId = pokemonId;
    this.store.loadPokemonDetails(pokemonId);
  }

  retryLoad(): void {
    if (this.pokemonId) {
      this.store.loadPokemonDetails(this.pokemonId);
    }
  }

  battleReadinessScore = computed(() => {
    const p = this.store.selectedPokemon();
    return p ? this.battleLogic.calculateBattleReadinessScore(p) : 0;
  });

  getFormattedId(id: number): string {
    return id.toString().padStart(3, '0');
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

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-neon-mint';
    if (score >= 60) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = "data:image/svg+xml,%3csvg width='128' height='128' viewBox='0 0 128' 128' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='128' height='128' fill='%231e293b'/%3e%3cline x1='32' y1='32' x2='96' y2='96' stroke='%23475569' stroke-width='4'/%3e%3cline x1='96' y1='32' x2='32' y2='96' stroke='%23475569' stroke-width='4'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8' dy='-1em'%3eImage%3c/text%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8' dy='1em'%3eUnavailable%3c/text%3e%3c/svg%3e";
  }
}