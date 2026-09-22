export const STORAGE_KEYS = {
  apiKey: 'rcg.apiKey',
  provider: 'rcg.provider',
  promptHistory: 'rcg.promptHistory',
  components: 'rcg.components',
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 프라이빗 모드·용량 초과 등으로 저장에 실패해도 앱 동작에는 영향이 없어야 한다.
  }
}
