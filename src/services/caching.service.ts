import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CachingService {
  private cache = new Map<string, { data: any, expiry: number }>();
  private ttl = 3_600_000; // 1 hour in milliseconds

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  set<T>(key: string, data: T): void {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { data, expiry });
  }
}
