# Standard Props

Shared prop groups used across components. Values use `space` tokens from `@lib/design`.

`SpaceScale`: `1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9`.

## Margin Props

- `m`: Margin on all sides.
- `mx`: Horizontal margin.
- `my`: Vertical margin.

## Padding Props

- `p`: Padding on all sides.
- `px`: Horizontal padding.
- `py`: Vertical padding.

## Trim Props

Remove extra whitespace caused by line-height.

- `trim`: Side to trim. `'start' | 'end' | 'both'`.

## Truncate Props

Single-line ellipsis when text overflows. Requires a constrained width. No-op on inline hosts (`Link`, `<Text as="span">`); promote to `display: inline-block` or wrap in a block-level parent.

- `truncate`: Truncate overflowing text. `boolean`.

## Wrap Props

Word-wrapping strategy. `pretty` and `balance` only constrain line breaks within a block formatting context, so they're no-ops on inline hosts.

- `wrap`: Word-wrapping strategy. `'wrap' | 'nowrap' | 'pretty' | 'balance'`.

## Selectable Props

Override the global `user-select: none` default.

- `selectable`: Allow text selection. `boolean`.

## Skeleton Props

Render the component as a pulsing placeholder while data loads. The component swaps in a skeleton overlay; consumer-supplied class, style, margin, and `data-testid` stay attached so toggling the prop doesn't drop layout or test hooks.

- `skeleton`: Render as a pulsing placeholder. `boolean`.

## Test ID Props

Attach a test identifier to the underlying DOM node.

- `testId`: Renders as `data-testid`. `string`.

## Required Mobile Input Props

Forcing function for mobile-input attributes that have outsized impact on the on-screen keyboard, autofill, and password-manager experience. Required on text input components so authors actively pick a value or pass `undefined` as a deliberate "considered, no preset applies." `undefined` omits the attribute, matching the browser default.

- `autocomplete` (required): Autofill semantic. Pick the most specific token (`'email'`, `'one-time-code'`, `'current-password'`, `'name'`, `'street-address'`, …), `'off'` to suppress autofill, or `undefined` if no preset applies.
- `autocapitalize` (required): Mobile auto-capitalization. `'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters' | undefined`. `'off'` for usernames/emails/codes; `'sentences'` for prose; `'words'` for proper nouns; `'characters'` for uppercase codes.
- `enterkeyhint` (required): On-screen Enter key label. `'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send' | undefined`. `undefined` is common on `<textarea>` — Enter inserts a newline.
