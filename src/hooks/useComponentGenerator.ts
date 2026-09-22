import { useState, useCallback } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { STORAGE_KEYS } from '../utils/storage';
import { usePersistedState } from './usePersistedState';

const MAX_PROMPT_HISTORY = 50;

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  promptHistory: string[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

/** localStorage에서 읽은 JSON은 createdAt이 문자열이므로 Date 인스턴스로 되살린다. */
export function reviveComponentDates(components: GeneratedComponent[]): GeneratedComponent[] {
  return components.map((component) => ({
    ...component,
    createdAt: new Date(component.createdAt),
  }));
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = usePersistedState<GeneratedComponent[]>(
    STORAGE_KEYS.components,
    [],
    reviveComponentDates
  );
  const [promptHistory, setPromptHistory] = usePersistedState<string[]>(
    STORAGE_KEYS.promptHistory,
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    setPromptHistory((prev) => {
      if (prev[0] === prompt) return prev;
      return [prompt, ...prev].slice(0, MAX_PROMPT_HISTORY);
    });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate component');
      }

      const newComponent: GeneratedComponent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        prompt,
        code: data.code,
        createdAt: new Date(),
      };

      setComponents((prev) => [newComponent, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setComponents, setPromptHistory]);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, [setComponents]);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, [setComponents]);

  return { components, promptHistory, isLoading, error, generate, removeComponent, clearAll };
}
