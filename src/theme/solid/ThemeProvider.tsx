import {
  createSignal,
  createEffect,
  onCleanup,
  type JSX,
  onMount,
} from 'solid-js';
import { ThemeContext, type Appearance } from './use-theme';

export interface ThemeProviderProps {
  appearance?: 'light' | 'dark' | 'auto';
  accentColor?: string;
  grayColor?: string;
  scaling?: '90%' | '95%' | '100%' | '105%' | '110%';
  radius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  children: JSX.Element;
}

export function ThemeProvider(props: ThemeProviderProps) {
  const [resolved, setResolved] = createSignal<Appearance>('light');

  onMount(() => {
    createEffect(() => {
      const appearance = props.appearance ?? 'auto';
      const el = document.documentElement;

      if (appearance === 'auto') {
        el.removeAttribute('data-theme');
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const update = () => setResolved(mql.matches ? 'dark' : 'light');
        update();
        mql.addEventListener('change', update);
        onCleanup(() => mql.removeEventListener('change', update));
      } else {
        el.setAttribute('data-theme', appearance);
        setResolved(appearance);
      }
    });

    createEffect(() => {
      const el = document.documentElement;
      if (props.accentColor) el.setAttribute('data-accent-color', props.accentColor);
      if (props.grayColor) el.setAttribute('data-gray-color', props.grayColor);
      if (props.scaling) el.setAttribute('data-scaling', props.scaling);
      if (props.radius) el.setAttribute('data-radius', props.radius);
    });
  });

  return (
    <ThemeContext.Provider value={{ appearance: resolved }}>
      {props.children}
    </ThemeContext.Provider>
  );
}
