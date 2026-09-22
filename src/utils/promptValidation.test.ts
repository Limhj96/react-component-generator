import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePromptLength } from './promptValidation';

describe('validatePromptLength', () => {
  it('500자 이하 프롬프트는 유효하다 (null 반환)', () => {
    expect(validatePromptLength('a'.repeat(500))).toBeNull();
  });

  it('501자 프롬프트는 에러 메시지를 반환한다', () => {
    expect(validatePromptLength('a'.repeat(501))).toBe(
      `프롬프트는 최대 ${MAX_PROMPT_LENGTH}자까지 입력할 수 있습니다.`
    );
  });

  it('빈 문자열은 유효하다 (null 반환)', () => {
    expect(validatePromptLength('')).toBeNull();
  });
});
