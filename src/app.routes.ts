import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'pokedex',
    loadComponent: () =>
      import('./features/pokemon-list/pokemon-list.component').then(
        (m) => m.PokemonListComponent
      ),
  },
  {
    path: 'pokedex/:id',
    loadComponent: () =>
      import('./features/pokemon-detail/pokemon-detail.component').then(
        (m) => m.PokemonDetailComponent
      ),
  },
  {
    path: 'compare',
    loadComponent: () =>
      import('./features/compare/compare.component').then(
        (m) => m.CompareComponent
      ),
  },
  {
    path: 'types',
    loadComponent: () =>
      import('./features/type-explorer/type-explorer.component').then(
        (m) => m.TypeExplorerComponent
      ),
  },
  {
    path: '',
    redirectTo: '/pokedex',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/pokedex',
  },
];
