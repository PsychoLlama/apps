export function getPropertyName(key: {
  type: string;
  name?: string;
  value?: string | number;
}): string | null {
  if (key.type === 'Identifier') return key.name ?? null;
  if (key.type === 'Literal' && typeof key.value === 'string') return key.value;
  return null;
}
