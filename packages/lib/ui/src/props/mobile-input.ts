import type { JSX } from 'solid-js';
import type { ArgTypes } from 'storybook-solidjs-vite';

/**
 * Required mobile-input attributes — a forcing function for authors.
 *
 * `autocomplete`, `autocapitalize`, and `enterkeyhint` each have
 * outsized impact on the on-screen keyboard, autofill, and
 * password-manager experience, and they're trivially easy to forget.
 * Required so every author actively picks a value or passes
 * `undefined` as a deliberate "considered, no preset applies." An
 * `undefined` value renders as the browser default — the attribute
 * is omitted from the DOM.
 */
export interface RequiredMobileInputProps {
  /**
   * Autofill semantic. Pick the most specific token (`'email'`,
   * `'one-time-code'`, `'current-password'`, `'name'`,
   * `'street-address'`, …), `'off'` to suppress autofill, or
   * `undefined` if no preset applies. Drives password managers,
   * iOS SMS code autofill, and address/contact autofill.
   */
  autocomplete: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete'];
  /**
   * Mobile auto-capitalization. `'off'` for usernames, emails, and
   * codes; `'sentences'` for prose; `'words'` for proper nouns;
   * `'characters'` for codes that display uppercase. `undefined` if
   * no preset applies. Browsers default to `'sentences'`, which is
   * usually wrong for identifiers.
   */
  autocapitalize: JSX.InputHTMLAttributes<HTMLInputElement>['autocapitalize'];
  /**
   * On-screen Enter key label. `'enter'` for fields with no special
   * submit role; `'done' | 'go' | 'next' | 'previous' | 'search' |
   * 'send'` for the matching form action. `undefined` if no preset
   * applies — common on `<textarea>`, where Enter inserts a newline.
   */
  enterkeyhint: JSX.InputHTMLAttributes<HTMLInputElement>['enterkeyhint'];
}

export const requiredMobileInputPropKeys = [
  'autocomplete',
  'autocapitalize',
  'enterkeyhint',
] as const;

export const requiredMobileInputArgTypes: ArgTypes<RequiredMobileInputProps> = {
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
