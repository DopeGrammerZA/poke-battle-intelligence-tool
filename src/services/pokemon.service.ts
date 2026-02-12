import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { mergeMap, catchError, retry, delay } from 'rxjs/operators';
import { Pokemon, PokemonListResponse, PokemonSpecies, TypeDetails } from '../models/pokemon.models';
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
           if (error.status === 429 || error.status >= 500) {
             return of(true).pipe(delay(1000 * Math.pow(2, retryCount - 1)));
           }
           return throwError(() => error);
        }
      }),
      catchError((err: any) => {
        console.error(`Failed to fetch from ${url}`, err);
        if (err.status === 404) {
          const name = url.split('/').pop();
          return throwError(() => new Error(`Pokémon '${name}' could not be found.`));
        }
        return throwError(() => new Error(`An API error occurred. Please try again.`));
      })
    );
  }

  getPokemonList(limit: number = 151, offset: number = 0): Observable<PokemonListResponse> {
    const url = `${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`;
    return this.fetchAndCache<PokemonListResponse>(url);
  }

  getPokemonDetails(name: string): Observable<Pokemon> {
    const url = `${this.baseUrl}/pokemon/${name.toLowerCase()}`;
    return this.fetchAndCache<Pokemon>(url).pipe(
        mergeMap(pokemon => {
            const speciesUrl = `${this.baseUrl}/pokemon-species/${pokemon.id}`;
            return this.fetchAndCache<PokemonSpecies>(speciesUrl).pipe(
                mergeMap(species => {
                    return of({
                        ...pokemon,
                        is_legendary: species.is_legendary,
                        is_mythical: species.is_mythical,
                    });
                })
            );
        })
    );
  }
  
  getPokemonByUrl(url: string): Observable<Pokemon> {
     return this.fetchAndCache<Pokemon>(url).pipe(
        mergeMap(pokemon => {
            const speciesUrl = `${this.baseUrl}/pokemon-species/${pokemon.id}`;
            return this.fetchAndCache<PokemonSpecies>(speciesUrl).pipe(
                mergeMap(species => {
                    return of({
                        ...pokemon,
                        is_legendary: species.is_legendary,
                        is_mythical: species.is_mythical,
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