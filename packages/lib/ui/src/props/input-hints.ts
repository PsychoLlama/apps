import type { JSX } from 'solid-js';
import type { ArgTypes } from 'storybook-solidjs-vite';

/**
 * Required platform hints for text input components — a forcing
 * function for authors. Required so every author actively chooses, or
 * passes `undefined` as a deliberate "considered, no preset applies."
 * `undefined` omits the attribute, matching the browser default.
 */
export interface RequiredInputHintProps {
  autocomplete: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete'];
  autocapitalize: JSX.InputHTMLAttributes<HTMLInputElement>['autocapitalize'];
  enterkeyhint: JSX.InputHTMLAttributes<HTMLInputElement>['enterkeyhint'];
}

export const requiredInputHintArgTypes: ArgTypes<RequiredInputHintProps> = {
  autocomplete: {
    control: 'text',
  },
  autocapitalize: {
    control: 'select',
    options: [
      undefined,
      'off',
      'none',
      'on',
      'sentences',
      'words',
      'characters',
    ],
  },
  enterkeyhint: {
    control: 'select',
    options: [
      undefined,
      'enter',
      'done',
      'go',
      'next',
      'previous',
      'search',
      'send',
    ],
  },
};
