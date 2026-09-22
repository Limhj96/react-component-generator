export const MAX_PROMPT_LENGTH = 500;

export function validatePromptLength(prompt: string): string | null {
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return `프롬프트는 최대 ${MAX_PROMPT_LENGTH}자까지 입력할 수 있습니다.`;
  }
  return null;
}
