// Cursor tokens for interactive elements.
// Indirection lets us swap cursors globally (e.g. default vs pointer for buttons).
export const cursors = {
  interactive: 'pointer',
  disabled: 'not-allowed',
  grab: 'grab',
  grabbing: 'grabbing',
} as const;
