import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { mergeMap, catchError, retry, delay } from 'rxjs/operators';
import { Ability, AbilityListResponse } from '../models/ability.models';
import { CachingService } from './caching.service';

@Injectable({
  providedIn: 'root'
})
export class AbilityService {
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
           if (error.status === 429 || error.status >= 500 || error.status === 0) {
             return of(true).pipe(delay(1000 * Math.pow(2, retryCount - 1)));
           }
           return throwError(() => error);
        }
      }),
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse) {
            if (err.status === 404) {
              const name = url.split('/').pop();
              return throwError(() => new Error(`Ability '${name}' could not be found.`));
            }
            if (err.status === 0 || err.error instanceof ErrorEvent) {
                return throwError(() => new Error('A network error occurred. Please check your connection.'));
            }
            return throwError(() => new Error(`An API error occurred (Status: ${err.status}). Please try again.`));
        }
        return throwError(() => new Error('An unexpected error occurred. Please try again.'));
      })
    );
  }

  getAbilityList(limit: number = 20, offset: number = 0): Observable<AbilityListResponse> {
    const url = `${this.baseUrl}/ability?limit=${limit}&offset=${offset}`;
    return this.fetchAndCache<AbilityListResponse>(url);
  }

  getAbilityDetails(name: string): Observable<Ability> {
    const url = `${this.baseUrl}/ability/${name.toLowerCase()}`;
    return this.fetchAndCache<Ability>(url);
  }
}
