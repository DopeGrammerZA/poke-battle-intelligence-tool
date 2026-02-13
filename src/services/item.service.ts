import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { mergeMap, catchError, retry, delay } from 'rxjs/operators';
import { Item, ItemListResponse, ItemListItem, ItemCategory } from '../models/item.models';
import { CachingService } from './caching.service';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
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
              return throwError(() => new Error(`Item '${name}' could not be found.`));
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

  getItemList(limit: number = 20, offset: number = 0): Observable<ItemListResponse> {
    const url = `${this.baseUrl}/item?limit=${limit}&offset=${offset}`;
    return this.fetchAndCache<ItemListResponse>(url);
  }

  getItemDetails(name: string): Observable<Item> {
    const url = `${this.baseUrl}/item/${name.toLowerCase()}`;
    return this.fetchAndCache<Item>(url);
  }
  
  getItemDetailsByUrl(url: string): Observable<Item> {
      return this.fetchAndCache<Item>(url);
  }

  getAllItemCategories(): Observable<ItemListResponse> {
    // There are about 50 categories, so fetching all is fine.
    const url = `${this.baseUrl}/item-category?limit=100`;
    return this.fetchAndCache<ItemListResponse>(url);
  }

  getCategoryDetails(name: string): Observable<ItemCategory> {
      const url = `${this.baseUrl}/item-category/${name.toLowerCase()}`;
      return this.fetchAndCache<ItemCategory>(url);
  }
}
