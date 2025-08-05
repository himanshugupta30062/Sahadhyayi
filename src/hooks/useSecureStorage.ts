import { useCallback, useEffect, useState } from 'react';
import { logSecurityEvent } from '../utils/security';

// Type-safe storage interface
interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

// Security wrapper for storage operations
class SecureStorage {
  private storage: Storage;
  private prefix: string;

  constructor(storage: Storage, prefix = 'sahadhyayi_') {
    this.storage = storage;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    // Sanitize key to prevent injection
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
    return `${this.prefix}${sanitizedKey}`;
  }

  private isExpired(item: StorageItem<any>): boolean {
    if (!item.expiry) return false;
    return Date.now() > item.timestamp + item.expiry;
  }

  setItem<T>(key: string, value: T, expiryMs?: number): boolean {
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: expiryMs
      };
      
      const serialized = JSON.stringify(item);
      
      // Check storage quota
      if (serialized.length > 1024 * 1024) { // 1MB limit
        logSecurityEvent('STORAGE_SIZE_EXCEEDED', { key, size: serialized.length });
        return false;
      }
      
      this.storage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      logSecurityEvent('STORAGE_SET_ERROR', { key, error: String(error) });
      return false;
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const stored = this.storage.getItem(this.getKey(key));
      if (!stored) return null;

      const item: StorageItem<T> = JSON.parse(stored);
      
      if (this.isExpired(item)) {
        this.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      logSecurityEvent('STORAGE_GET_ERROR', { key, error: String(error) });
      this.removeItem(key); // Remove corrupted data
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(this.getKey(key));
    } catch (error) {
      logSecurityEvent('STORAGE_REMOVE_ERROR', { key, error: String(error) });
    }
  }

  clear(): void {
    try {
      // Only clear items with our prefix
      const keys = Object.keys(this.storage).filter(key => 
        key.startsWith(this.prefix)
      );
      keys.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      logSecurityEvent('STORAGE_CLEAR_ERROR', { error: String(error) });
    }
  }

  // Get all keys with our prefix
  getKeys(): string[] {
    try {
      return Object.keys(this.storage)
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      logSecurityEvent('STORAGE_KEYS_ERROR', { error: String(error) });
      return [];
    }
  }
}

// Storage instances
const secureLocalStorage = typeof window !== 'undefined' 
  ? new SecureStorage(localStorage) 
  : null;

const secureSessionStorage = typeof window !== 'undefined' 
  ? new SecureStorage(sessionStorage, 'sahadhyayi_session_') 
  : null;

// Hook for secure localStorage
export function useSecureLocalStorage<T>(
  key: string, 
  defaultValue: T,
  expiryMs?: number
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!secureLocalStorage) return defaultValue;
    const stored = secureLocalStorage.getItem<T>(key);
    return stored !== null ? stored : defaultValue;
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      if (secureLocalStorage) {
        secureLocalStorage.setItem(key, value, expiryMs);
      }
    } catch (error) {
      logSecurityEvent('HOOK_LOCALSTORAGE_SET_ERROR', { key, error: String(error) });
    }
  }, [key, expiryMs]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      if (secureLocalStorage) {
        secureLocalStorage.removeItem(key);
      }
    } catch (error) {
      logSecurityEvent('HOOK_LOCALSTORAGE_REMOVE_ERROR', { key, error: String(error) });
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}

// Hook for secure sessionStorage
export function useSecureSessionStorage<T>(
  key: string, 
  defaultValue: T,
  expiryMs?: number
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!secureSessionStorage) return defaultValue;
    const stored = secureSessionStorage.getItem<T>(key);
    return stored !== null ? stored : defaultValue;
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      if (secureSessionStorage) {
        secureSessionStorage.setItem(key, value, expiryMs);
      }
    } catch (error) {
      logSecurityEvent('HOOK_SESSIONSTORAGE_SET_ERROR', { key, error: String(error) });
    }
  }, [key, expiryMs]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      if (secureSessionStorage) {
        secureSessionStorage.removeItem(key);
      }
    } catch (error) {
      logSecurityEvent('HOOK_SESSIONSTORAGE_REMOVE_ERROR', { key, error: String(error) });
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}

// Hook for storage cleanup
export function useStorageCleanup() {
  const clearExpiredItems = useCallback(() => {
    if (!secureLocalStorage || !secureSessionStorage) return;

    try {
      // Clean localStorage
      const localKeys = secureLocalStorage.getKeys();
      localKeys.forEach(key => {
        secureLocalStorage.getItem(key); // This will auto-remove expired items
      });

      // Clean sessionStorage
      const sessionKeys = secureSessionStorage.getKeys();
      sessionKeys.forEach(key => {
        secureSessionStorage.getItem(key); // This will auto-remove expired items
      });
    } catch (error) {
      logSecurityEvent('STORAGE_CLEANUP_ERROR', { error: String(error) });
    }
  }, []);

  const clearAllStorage = useCallback(() => {
    try {
      secureLocalStorage?.clear();
      secureSessionStorage?.clear();
    } catch (error) {
      logSecurityEvent('STORAGE_CLEAR_ALL_ERROR', { error: String(error) });
    }
  }, []);

  // Auto-cleanup expired items on mount
  useEffect(() => {
    clearExpiredItems();
    
    // Set up periodic cleanup
    const interval = setInterval(clearExpiredItems, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [clearExpiredItems]);

  return { clearExpiredItems, clearAllStorage };
}

export { secureLocalStorage, secureSessionStorage };