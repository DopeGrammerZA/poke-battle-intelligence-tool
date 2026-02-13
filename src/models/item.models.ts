export interface ItemListItem {
  name: string;
  url: string;
}

export interface ItemListResponse {
  results: ItemListItem[];
  count: number;
}

export interface Item {
  id: number;
  name: string;
  cost: number;
  sprites: {
    default: string | null;
  };
  attributes: ItemListItem[];
  category: ItemListItem;
  effect_entries: {
    effect: string;
    short_effect: string;
    language: ItemListItem;
  }[];
  flavor_text_entries: {
    text: string;
    language: ItemListItem;
    version_group: ItemListItem;
  }[];
  held_by_pokemon: {
    pokemon: ItemListItem;
    version_details: {
      rarity: number;
      version: ItemListItem;
    }[];
  }[];
  fling_power: number | null;
  fling_effect: ItemListItem | null;
}

export interface ItemCategory {
    id: number;
    name: string;
    items: ItemListItem[];
    names: {
        name: string;
        language: ItemListItem;
    }[];
}
