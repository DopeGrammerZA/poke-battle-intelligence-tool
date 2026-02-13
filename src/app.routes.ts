import { Routes } from '@angular/router';
import { PokemonListComponent } from './components/pokemon-list/pokemon-list.component';
import { PokemonDetailComponent } from './components/pokemon-detail/pokemon-detail.component';
import { CompareComponent } from './components/compare/compare.component';
import { TypeExplorerComponent } from './components/type-explorer/type-explorer.component';
import { EvolutionChainComponent } from './components/evolution-chain/evolution-chain.component';
import { ItemListComponent } from './components/item-list/item-list.component';
import { ItemDetailComponent } from './components/item-detail/item-detail.component';
import { AbilityListComponent } from './components/ability-list/ability-list.component';
import { AbilityDetailComponent } from './components/ability-detail/ability-detail.component';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'pokemon', pathMatch: 'full' },
  { path: 'pokemon', component: PokemonListComponent, title: 'Pokémon List' },
  { path: 'pokemon/:id', component: PokemonDetailComponent, title: 'Pokémon Details' },
  { path: 'compare', component: CompareComponent, title: 'Compare Pokémon' },
  { path: 'types', component: TypeExplorerComponent, title: 'Type Explorer' },
  { path: 'evolutions', component: EvolutionChainComponent, title: 'Evolution Explorer' },
  { path: 'items', component: ItemListComponent, title: 'Item Dex' },
  { path: 'item/:name', component: ItemDetailComponent, title: 'Item Details' },
  { path: 'abilities', component: AbilityListComponent, title: 'Ability Dex' },
  { path: 'ability/:name', component: AbilityDetailComponent, title: 'Ability Details' },
  { path: '**', redirectTo: 'pokemon' } 
];