export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  results: PokemonListItem[];
  count: number;
}

export interface FlavorTextEntry {
    flavor_text: string;
    language: {
        name: string;
        url: string;
    };
    version: {
        name:string;
        url: string;
    };
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
  flavor_text?: string;
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
    id: number;
    name: string;
    is_legendary: boolean;
    is_mythical: boolean;
    flavor_text_entries: FlavorTextEntry[];
    evolution_chain: {
        url: string;
    };
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

// Evolution Chain Models
export interface EvolutionChain {
    id: number;
    chain: ChainLink;
}

export interface ChainLink {
    is_baby: boolean;
    species: PokemonListItem;
    evolution_details: EvolutionDetail[];
    evolves_to: ChainLink[];
}

export interface EvolutionDetail {
    item: PokemonListItem | null;
    trigger: PokemonListItem;
    gender: number | null;
    held_item: PokemonListItem | null;
    known_move: PokemonListItem | null;
    known_move_type: PokemonListItem | null;
    location: PokemonListItem | null;
    min_level: number | null;
    min_happiness: number | null;
    min_beauty: number | null;
    min_affection: number | null;
    needs_overworld_rain: boolean;
    party_species: PokemonListItem | null;
    party_type: PokemonListItem | null;
    relative_physical_stats: number | null;
    time_of_day: string;
    trade_species: PokemonListItem | null;
    turn_upside_down: boolean;
}