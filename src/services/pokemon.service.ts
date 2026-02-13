import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { mergeMap, catchError, retry, delay } from 'rxjs/operators';
import { Pokemon, PokemonListResponse, PokemonSpecies, TypeDetails, EvolutionChain } from '../models/pokemon.models';
import { CachingService } from './caching.service';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private http = inject(HttpClient);
  private cache = inject(CachingService);
  private baseUrl = 'https://pokeapi.co/api/v2';

  private fetchAndCache<T>(url: string): Observable<T> {
    const cachedData = this.cache.get<T>(url);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get<T>(url).pipe(
      mergeMap(data => {
        this.cache.set(url, data);
        return of(data);
      }),
      retry({
        count: 3,
        delay: (error: any, retryCount) => {
           // Retry on rate limits, server errors, or network errors
           if (error.status === 429 || error.status >= 500 || error.status === 0) {
             console.log(`Attempt ${retryCount}: Retrying request to ${url} due to error...`);
             return of(true).pipe(delay(1000 * Math.pow(2, retryCount - 1)));
           }
           return throwError(() => error);
        }
      }),
      catchError((err: any) => {
        console.error(`Failed to fetch from ${url}`, err);
        if (err instanceof HttpErrorResponse) {
            if (err.status === 404) {
              const name = url.split('/').pop();
              return throwError(() => new Error(`Pokémon '${name}' could not be found.`));
            }
            if (err.status === 0 || err.error instanceof ErrorEvent) {
                return throwError(() => new Error('A network error occurred. Please check your connection.'));
            }
            return throwError(() => new Error(`An API error occurred (Status: ${err.status}). Please try again.`));
        }
        // Generic fallback for non-Http errors
        return throwError(() => new Error('An unexpected error occurred. Please try again.'));
      })
    );
  }

  getPokemonList(limit: number = 151, offset: number = 0): Observable<PokemonListResponse> {
    const url = `${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`;
    return this.fetchAndCache<PokemonListResponse>(url);
  }

  getPokemonDetails(nameOrId: string): Observable<Pokemon> {
    const url = `${this.baseUrl}/pokemon/${nameOrId.toLowerCase()}`;
    return this.fetchAndCache<Pokemon>(url).pipe(
        mergeMap(pokemon => {
            const speciesUrl = `${this.baseUrl}/pokemon-species/${pokemon.id}`;
            return this.fetchAndCache<PokemonSpecies>(speciesUrl).pipe(
                mergeMap(species => {
                    const englishFlavorText = [...species.flavor_text_entries]
                      .reverse()
                      .find(entry => entry.language.name === 'en')
                      ?.flavor_text.replace(/[\n\f\r]/g, ' ');

                    return of({
                        ...pokemon,
                        is_legendary: species.is_legendary,
                        is_mythical: species.is_mythical,
                        flavor_text: englishFlavorText,
                    });
                })
            );
        })
    );
  }

  getPokemonSpecies(nameOrId: string): Observable<PokemonSpecies> {
    const url = `${this.baseUrl}/pokemon-species/${nameOrId.toLowerCase()}`;
    return this.fetchAndCache<PokemonSpecies>(url);
  }

  getEvolutionChainByUrl(url: string): Observable<EvolutionChain> {
      return this.fetchAndCache<EvolutionChain>(url);
  }
  
  getPokemonByUrl(url: string): Observable<Pokemon> {
     return this.fetchAndCache<Pokemon>(url).pipe(
        mergeMap(pokemon => {
            const speciesUrl = `${this.baseUrl}/pokemon-species/${pokemon.id}`;
            return this.fetchAndCache<PokemonSpecies>(speciesUrl).pipe(
                mergeMap(species => {
                    const englishFlavorText = [...species.flavor_text_entries]
                      .reverse()
                      .find(entry => entry.language.name === 'en')
                      ?.flavor_text.replace(/[\n\f\r]/g, ' ');
                      
                    return of({
                        ...pokemon,
                        is_legendary: species.is_legendary,
                        is_mythical: species.is_mythical,
                        flavor_text: englishFlavorText,
                    });
                })
            );
        })
    );
  }

  getAllTypes(): Observable<{name: string, url: string}[]> {
    const url = `${this.baseUrl}/type`;
    return this.fetchAndCache<{results: {name: string, url: string}[]}>(url).pipe(
        mergeMap(response => of(response.results))
    );
  }

  getTypeDetails(typeName: string): Observable<TypeDetails> {
      const url = `${this.baseUrl}/type/${typeName.toLowerCase()}`;
      return this.fetchAndCache<TypeDetails>(url);
  }
}