import { Injectable } from '@angular/core';
import { Pokemon, WinnerPrediction, Type } from '../models/pokemon.models';

@Injectable({
  providedIn: 'root'
})
export class BattleLogicService {
  // Rows are attacking types, columns are defending types.
  private typeEffectivenessMatrix: { [key: string]: { [key: string]: number } } = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
  };

  private getStat(pokemon: Pokemon, statName: string): number {
    return pokemon.stats.find(s => s.stat.name === statName)?.base_stat ?? 0;
  }
  
  private calculateTypeMultiplier(attackerTypes: Type[], defenderTypes: Type[]): number {
    let multiplier = 1;
    for (const attackerType of attackerTypes) {
      let typeMultiplier = 1;
      for (const defenderType of defenderTypes) {
        const effectiveness = this.typeEffectivenessMatrix[attackerType.type.name]?.[defenderType.type.name];
        if (effectiveness !== undefined) {
          typeMultiplier *= effectiveness;
        }
      }
      // We take the higher multiplier if the attacker has two types
      multiplier = Math.max(multiplier, typeMultiplier);
    }
    return multiplier;
  }

  calculateBattleReadinessScore(pokemon: Pokemon): number {
    if (!pokemon) return 0;

    const totalStats = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
    const maxPossibleStats = 6 * 255; // Approx max
    const baseStatsScore = (totalStats / maxPossibleStats) * 100;

    const speed = this.getStat(pokemon, 'speed');
    const speedBonus = (speed / 200) * 100; // Normalizing against a high speed value

    // Simplified Type Advantage: Count super-effective matchups
    let typeAdvantageScore = 50; // Start at neutral
    const types = Object.keys(this.typeEffectivenessMatrix);
    let advantages = 0;
    pokemon.types.forEach(t => {
      const matchups = this.typeEffectivenessMatrix[t.type.name];
      for (const key in matchups) {
        if (matchups[key] === 2) advantages++;
      }
    });
    typeAdvantageScore = (advantages / (pokemon.types.length * 5)) * 100; // Heuristic
    
    const legendaryBonus = (pokemon.is_legendary || pokemon.is_mythical) ? 100 : 0;

    const score = (baseStatsScore * 0.4) + (typeAdvantageScore * 0.3) + (speedBonus * 0.2) + (legendaryBonus * 0.1);
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  predictWinner(p1: Pokemon, p2: Pokemon): WinnerPrediction {
    let p1Hp = this.getStat(p1, 'hp') * 10;
    let p2Hp = this.getStat(p2, 'hp') * 10;

    const p1Speed = this.getStat(p1, 'speed');
    const p2Speed = this.getStat(p2, 'speed');
    const p1Attack = this.getStat(p1, 'attack');
    const p1Defense = this.getStat(p2, 'defense');
    const p2Attack = this.getStat(p2, 'attack');
    const p2Defense = this.getStat(p1, 'defense');

    const p1Multiplier = this.calculateTypeMultiplier(p1.types, p2.types);
    const p2Multiplier = this.calculateTypeMultiplier(p2.types, p1.types);
    
    const p1Damage = Math.max(1, (p1Attack / p1Defense) * 10 * p1Multiplier);
    const p2Damage = Math.max(1, (p2Attack / p2Defense) * 10 * p2Multiplier);

    const firstAttacker = p1Speed >= p2Speed ? p1 : p2;
    const secondAttacker = p1Speed < p2Speed ? p1 : p2;
    
    for (let i = 0; i < 10; i++) {
      if (firstAttacker === p1) {
        p2Hp -= p1Damage;
        if (p2Hp <= 0) break;
        p1Hp -= p2Damage;
        if (p1Hp <= 0) break;
      } else {
        p1Hp -= p2Damage;
        if (p1Hp <= 0) break;
        p2Hp -= p1Damage;
        if (p2Hp <= 0) break;
      }
    }
    
    const p1Capitalized = p1.name.charAt(0).toUpperCase() + p1.name.slice(1);
    const p2Capitalized = p2.name.charAt(0).toUpperCase() + p2.name.slice(1);

    if (p1Hp <= 0 && p2Hp <= 0) {
      return { winner: null, loser: null, draw: true, explanation: 'The battle resulted in a draw after a fierce exchange!' };
    }
    
    if (p1Hp > p2Hp) {
      let explanation = `${p1Capitalized} has a decisive advantage.`;
      if (p1Speed > p2Speed) explanation += ` Its higher speed allows it to strike first.`;
      if (p1Multiplier > p2Multiplier) explanation += ` Its typing is super-effective against ${p2Capitalized}.`;
      return { winner: p1, loser: p2, draw: false, explanation };
    } else {
      let explanation = `${p2Capitalized} has a decisive advantage.`;
      if (p2Speed > p1Speed) explanation += ` Its higher speed allows it to strike first.`;
      if (p2Multiplier > p1Multiplier) explanation += ` Its typing is super-effective against ${p1Capitalized}.`;
      return { winner: p2, loser: p1, draw: false, explanation };
    }
  }
}
