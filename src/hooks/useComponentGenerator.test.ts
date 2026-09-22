import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComponentGenerator, reviveComponentDates } from './useComponentGenerator';
import { STORAGE_KEYS } from '../utils/storage';
import type { GeneratedComponent } from '../types';

function mockFetchOnce(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: async () => body,
    })
  );
}

describe('reviveComponentDates', () => {
  it('createdAt이 문자열인 컴포넌트를 Date 인스턴스로 되살린다', () => {
    const raw = [
      { id: '1', prompt: 'a', code: 'x', createdAt: '2024-01-01T00:00:00.000Z' },
    ] as unknown as GeneratedComponent[];

    const result = reviveComponentDates(raw);

    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });
});

describe('useComponentGenerator 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('localStorage에 저장된 components를 초기값으로 복원하며 createdAt을 Date로 되살린다', () => {
    localStorage.setItem(
      STORAGE_KEYS.components,
      JSON.stringify([
        { id: '1', prompt: '프로필 카드', code: 'x', createdAt: '2024-01-01T00:00:00.000Z' },
      ])
    );

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('components가 변경되면 localStorage에 저장한다', () => {
    localStorage.setItem(
      STORAGE_KEYS.components,
      JSON.stringify([
        { id: '1', prompt: '프로필 카드', code: 'x', createdAt: '2024-01-01T00:00:00.000Z' },
      ])
    );

    const { result } = renderHook(() => useComponentGenerator());

    act(() => {
      result.current.removeComponent('1');
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!);
    expect(stored).toEqual([]);
  });

  it('localStorage에 저장된 promptHistory를 초기값으로 복원한다', () => {
    localStorage.setItem(STORAGE_KEYS.promptHistory, JSON.stringify(['이전 프롬프트']));

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.promptHistory).toEqual(['이전 프롬프트']);
  });

  it('generate 호출 시 promptHistory 맨 앞에 프롬프트가 추가되고 localStorage에도 저장된다', async () => {
    mockFetchOnce({ code: 'const A = () => null;' });
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('새 프롬프트', 'key', 'google');
    });

    expect(result.current.promptHistory[0]).toBe('새 프롬프트');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.promptHistory)!);
    expect(stored[0]).toBe('새 프롬프트');
  });

  it('동일한 프롬프트를 연속으로 제출해도 promptHistory에 연속 중복이 쌓이지 않는다', async () => {
    mockFetchOnce({ code: 'const A = () => null;' });
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('같은 프롬프트', 'key', 'google');
    });
    await act(async () => {
      await result.current.generate('같은 프롬프트', 'key', 'google');
    });

    expect(result.current.promptHistory).toEqual(['같은 프롬프트']);
  });

  it('promptHistory는 최대 50개까지만 유지한다', async () => {
    mockFetchOnce({ code: 'const A = () => null;' });
    const { result } = renderHook(() => useComponentGenerator());

    for (let i = 0; i < 51; i++) {
      await act(async () => {
        await result.current.generate(`프롬프트-${i}`, 'key', 'google');
      });
    }

    await waitFor(() => {
      expect(result.current.promptHistory).toHaveLength(50);
    });
    expect(result.current.promptHistory[0]).toBe('프롬프트-50');
  });
});
