import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readJSON, writeJSON } from './storage';

describe('readJSON', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('키가 없으면 fallback을 반환한다', () => {
    expect(readJSON('missing-key', 'fallback')).toBe('fallback');
  });

  it('저장된 JSON을 파싱해 반환한다', () => {
    localStorage.setItem('key', JSON.stringify({ a: 1 }));
    expect(readJSON('key', {})).toEqual({ a: 1 });
  });

  it('손상된 JSON이 저장돼 있으면 fallback을 반환한다', () => {
    localStorage.setItem('key', '{not-valid-json');
    expect(readJSON('key', 'fallback')).toBe('fallback');
  });
});

describe('writeJSON', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('값을 JSON.stringify해 localStorage에 저장한다', () => {
    writeJSON('key', { a: 1 });
    expect(localStorage.getItem('key')).toBe(JSON.stringify({ a: 1 }));
  });

  it('localStorage.setItem이 예외를 던져도 조용히 무시한다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => writeJSON('key', { a: 1 })).not.toThrow();
  });
});
