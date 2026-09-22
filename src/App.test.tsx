import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { STORAGE_KEYS } from './utils/storage';

function mockConfigFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ envKeys: { anthropic: false, google: false } }),
    })
  );
}

describe('App 상태 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfigFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('localStorage에 저장된 apiKey와 provider를 초기값으로 복원한다', () => {
    localStorage.setItem(STORAGE_KEYS.apiKey, JSON.stringify('sk-ant-saved'));
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify('anthropic'));

    render(<App />);

    expect(screen.getByLabelText('API Key')).toHaveValue('sk-ant-saved');
    expect(screen.getByLabelText('Provider')).toHaveValue('anthropic');
  });

  it('apiKey를 입력하면 localStorage에 저장한다', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('API Key'), {
      target: { value: 'sk-new-key' },
    });

    expect(localStorage.getItem(STORAGE_KEYS.apiKey)).toBe(JSON.stringify('sk-new-key'));
  });

  it('provider를 바꾸면 localStorage에 저장한다', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Provider'), {
      target: { value: 'anthropic' },
    });

    expect(localStorage.getItem(STORAGE_KEYS.provider)).toBe(JSON.stringify('anthropic'));
  });
});
