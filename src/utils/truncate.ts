export function truncate(text: string, maxLen: number = 4000): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}
