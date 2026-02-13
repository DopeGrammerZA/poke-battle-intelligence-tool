import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CachingService {
  private storage: Storage | null = null;
  private ttl = 3_600_000; // 1 hour in milliseconds

  constructor() {
    // Check if sessionStorage is available and usable.
    // This prevents errors in environments where sessionStorage is not available (e.g., server-side rendering).
    try {
      this.storage = window.sessionStorage;
      const testKey = '__pokeintel_test__';
      this.storage.setItem(testKey, testKey);
      this.storage.removeItem(testKey);
    } catch (e) {
      this.storage = null;
      console.warn('sessionStorage is not available. Caching will be disabled.');
    }
  }

  get<T>(key: string): T | null {
    if (!this.storage) {
      return null;
    }

    const rawItem = this.storage.getItem(key);
    if (!rawItem) {
      return null;
    }

    try {
      const item = JSON.parse(rawItem);
      if (Date.now() > item.expiry) {
        this.storage.removeItem(key);
        return null;
      }
      return item.data as T;
    } catch (e) {
      console.error('Error parsing cached data from sessionStorage', e);
      // Corrupted data, remove it.
      this.storage.removeItem(key);
      return null;
    }
  }

  set<T>(key: string, data: T): void {
    if (!this.storage) {
      return;
    }

    const expiry = Date.now() + this.ttl;
    const item = { data, expiry };
    try {
      this.storage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error('Failed to write to sessionStorage. Cache might be full.', e);
    }
  }
}