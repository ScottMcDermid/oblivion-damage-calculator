import { useState, useCallback, useEffect } from 'react';

// eslint-disable-next-line no-unused-vars
type SetValue<T> = (value: T | ((prev: T) => T)) => void;

/**
 * A drop-in replacement for useState that persists the value to localStorage.
 *
 * Hydration-safe: the server and the initial client render both use `initialValue`
 * (matching the server HTML). After hydration, a useEffect synchronises the state
 * to whatever is stored in localStorage, avoiding React hydration mismatches.
 *
 * JSON parse errors and storage quota errors are caught and handled gracefully.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // Always start with initialValue so server and first client render match.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // After hydration, read the persisted value from localStorage (client-only).
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // Corrupt data — keep the initialValue already in state
    }
  // Run once on mount. `key` and `initialValue` are intentionally excluded:
  // changing them after mount is not a supported usage pattern.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue: SetValue<T> = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Quota exceeded or private-browsing restriction — state still updates in memory
        }
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
