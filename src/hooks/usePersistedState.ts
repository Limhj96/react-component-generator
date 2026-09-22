import { useState, useEffect } from 'react';
import { readJSON, writeJSON } from '../utils/storage';

/** state를 localStorage와 동기화한다: 초기값을 storage에서 복원하고, 변경될 때마다 다시 저장한다. */
export function usePersistedState<T>(key: string, fallback: T, revive?: (value: T) => T) {
  const [value, setValue] = useState<T>(() => {
    const loaded = readJSON(key, fallback);
    return revive ? revive(loaded) : loaded;
  });

  useEffect(() => {
    writeJSON(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
