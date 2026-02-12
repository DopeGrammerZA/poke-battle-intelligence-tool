import { Routes } from '@angular/router';
import { PokemonListComponent } from './components/pokemon-list/pokemon-list.component';
import { PokemonDetailComponent } from './components/pokemon-detail/pokemon-detail.component';
import { CompareComponent } from './components/compare/compare.component';
import { TypeExplorerComponent } from './components/type-explorer/type-explorer.component';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'pokemon', pathMatch: 'full' },
  { path: 'pokemon', component: PokemonListComponent, title: 'Pokémon List' },
  { path: 'pokemon/:name', component: PokemonDetailComponent, title: 'Pokémon Details' },
  { path: 'compare', component: CompareComponent, title: 'Compare Pokémon' },
  { path: 'types', component: TypeExplorerComponent, title: 'Type Explorer' },
  { path: '**', redirectTo: 'pokemon' } 
];
