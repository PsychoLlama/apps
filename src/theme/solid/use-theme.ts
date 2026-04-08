import { createContext, useContext } from 'solid-js';

export type Appearance = 'light' | 'dark';

interface ThemeContextValue {
  appearance: () => Appearance;
}

export const ThemeContext = createContext<ThemeContextValue>({
  appearance: () => 'light',
});

export function useTheme() {
  return useContext(ThemeContext);
}
