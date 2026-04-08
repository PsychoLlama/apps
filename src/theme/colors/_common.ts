/** Shape of a color scale contract (12 solid + 12 alpha + 4 semantic). */
export function colorContractShape(prefix: string) {
  const s: Record<string, string> = {};
  for (let i = 1; i <= 12; i++) {
    s[i] = `${prefix}-${i}`;
    s[`a${i}`] = `${prefix}-a${i}`;
  }
  s.contrast = `${prefix}-contrast`;
  s.surface = `${prefix}-surface`;
  s.indicator = `${prefix}-indicator`;
  s.track = `${prefix}-track`;
  return s;
}

/** Shape of an alpha-only scale contract (12 steps). */
export function alphaContractShape(prefix: string) {
  const s: Record<string, string> = {};
  for (let i = 1; i <= 12; i++) s[`a${i}`] = `${prefix}-a${i}`;
  return s;
}
