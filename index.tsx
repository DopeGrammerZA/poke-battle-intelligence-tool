
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { AppComponent } from './src/app.component';
import { routes } from './src/app.routes';

// Placeholder interceptors - will be implemented later
import { cacheInterceptor } from './src/core/interceptors/cache.interceptor';
import { errorInterceptor } from './src/core/interceptors/error.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([cacheInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
