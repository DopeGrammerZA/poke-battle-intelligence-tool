
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';
import { PokemonService } from './src/services/pokemon.service';
import { ItemService } from './src/services/item.service';
import { AbilityService } from './src/services/ability.service';
import { CachingService } from './src/services/caching.service';
import { BattleLogicService } from './src/services/battle-logic.service';
import { PokemonStore } from './src/store/pokemon.store';
import { ItemStore } from './src/store/item.store';
import { AbilityStore } from './src/store/ability.store';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(APP_ROUTES, withHashLocation()),
    PokemonService,
    ItemService,
    AbilityService,
    CachingService,
    BattleLogicService,
    PokemonStore,
    ItemStore,
    AbilityStore,
  ],
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.