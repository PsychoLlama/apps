export { vars } from './contract.css';
export { breakpoints, type Breakpoint } from './breakpoints';

// Tokens — side-effect imports activate the theme's CSS variables
import './tokens/scaling.css';
import './tokens/spacing.css';
import './tokens/typography.css';
import './tokens/radii.css';
import './tokens/shadows.css';
import './semantic.css';

// SolidJS integration
export { ThemeProvider, type ThemeProviderProps } from './solid/ThemeProvider';
export { useTheme, type Appearance } from './solid/use-theme';
