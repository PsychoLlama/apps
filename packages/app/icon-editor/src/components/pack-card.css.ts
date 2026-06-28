import { style } from '@vanilla-extract/css';
import { accent, neutral } from '@lib/design';

// `<Card>` defaults to center-aligned text inherited from the host
// button. Left-align so the pack name and count don't shift as content
// wraps.
export const packCard = style({
  textAlign: 'left',
});

// Selected-pack indicator. `:where(.interactive:hover)` in Card has zero
// specificity, so a plain class with one nested `:hover` wins.
export const packCardActive = style({
  backgroundColor: accent.alpha[3],
  color: accent.solid[11],
  ':hover': {
    backgroundColor: accent.alpha[4],
  },
});

// Sample tile — sized to make the preview row prominent on the card.
// Each tile carries its own square footprint so non-square icons
// (Academicons 448×512, etc.) letterbox cleanly inside.
export const packSample = style({
  width: '32px',
  height: '32px',
  color: neutral.solid[11],
});
