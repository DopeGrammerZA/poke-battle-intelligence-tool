export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  results: PokemonListItem[];
  count: number;
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  stats: Stat[];
  types: Type[];
  abilities: Ability[];
  is_legendary?: boolean; // From species
  is_mythical?: boolean; // From species
}

export interface Stat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface Type {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface Ability {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonSpecies {
    is_legendary: boolean;
    is_mythical: boolean;
}

export interface TypeDetails {
    name: string;
    pokemon: {
        pokemon: PokemonListItem;
        slot: number;
    }[];
    damage_relations: DamageRelations;
}

export interface DamageRelations {
    double_damage_from: TypeRelation[];
    double_damage_to: TypeRelation[];
    half_damage_from: TypeRelation[];
    half_damage_to: TypeRelation[];
    no_damage_from: TypeRelation[];
    no_damage_to: TypeRelation[];
}

export interface TypeRelation {
    name: string;
    url: string;
}

export interface ComparisonPair {
    pokemon1: Pokemon | null;
    pokemon2: Pokemon | null;
}

export interface WinnerPrediction {
    winner: Pokemon | null;
    loser: Pokemon | null;
    explanation: string;
    draw: boolean;
}
