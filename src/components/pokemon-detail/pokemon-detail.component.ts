import { ChangeDetectionStrategy, Component, computed, inject, Input } from '@angular/core';
import { PokemonStore } from '../../store/pokemon.store';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BattleLogicService } from '../../services/battle-logic.service';

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pokemon-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailComponent {
  store = inject(PokemonStore);
  battleLogic = inject(BattleLogicService);

  @Input({ required: true })
  set name(pokemonName: string) {
    this.store.loadPokemonDetails(pokemonName);
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
}
