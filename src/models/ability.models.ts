// A resource that has a name and a URL, commonly used in PokéAPI
interface NamedAPIResource {
  name: string;
  url: string;
}

// The name of a resource in a specific language
interface Name {
  name: string;
  language: NamedAPIResource;
}

// The effect of a resource in a specific language
interface VerboseEffect {
  effect: string;
  short_effect: string;
  language: NamedAPIResource;
}

// An effect text in a specific language
interface Effect {
  effect: string;
  language: NamedAPIResource;
}

// Flavor text for an ability in a specific language and version group
interface AbilityFlavorText {
  flavor_text: string;
  language: NamedAPIResource;
  version_group: NamedAPIResource;
}

// A record of a previous effect an ability had in a past version group
interface AbilityEffectChange {
  effect_entries: Effect[];
  version_group: NamedAPIResource;
}

// A Pokémon that can have this ability
interface AbilityPokemon {
  is_hidden: boolean;
  slot: number;
  pokemon: NamedAPIResource;
}

// The detailed model for a single Pokémon ability
export interface Ability {
  id: number;
  name: string;
  is_main_series: boolean;
  generation: NamedAPIResource;
  names: Name[];
  effect_entries: VerboseEffect[];
  effect_changes: AbilityEffectChange[];
  flavor_text_entries: AbilityFlavorText[];
  pokemon: AbilityPokemon[];
}

// An item in the list from the /ability endpoint
export interface AbilityListItem {
  name: string;
  url: string;
}

// The response from the /ability endpoint
export interface AbilityListResponse {
  results: AbilityListItem[];
  count: number;
}
