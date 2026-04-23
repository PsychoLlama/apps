/**
 * Inset styles.
 *
 * Reads CSS vars assigned by the parent Card to derive negative margins,
 * letting content escape the card's padding while still tracking the
 * active size.
 */

import { style, styleVariants } from '@vanilla-extract/css';
import {
  cardBorderRadius,
  cardPaddingBottom,
  cardPaddingLeft,
  cardPaddingRight,
  cardPaddingTop,
} from '../card/card.vars.css';

const neg = (value: string) => `calc(${value} * -1)`;

export const base = style({
  display: 'block',
  overflow: 'hidden',
});

// Each side variant both breaks out margins and rounds the corners
// that now sit flush with the card's outer edge. Corners that remain
// inside the card body keep their initial 0 radius.
export const side = styleVariants({
  all: {
    margin: `${neg(cardPaddingTop)} ${neg(cardPaddingRight)} ${neg(cardPaddingBottom)} ${neg(cardPaddingLeft)}`,
    borderTopLeftRadius: cardBorderRadius,
    borderTopRightRadius: cardBorderRadius,
    borderBottomLeftRadius: cardBorderRadius,
    borderBottomRightRadius: cardBorderRadius,
  },
  x: {
    marginLeft: neg(cardPaddingLeft),
    marginRight: neg(cardPaddingRight),
  },
  y: {
    marginTop: neg(cardPaddingTop),
    marginBottom: neg(cardPaddingBottom),
  },
  top: {
    marginTop: neg(cardPaddingTop),
    marginLeft: neg(cardPaddingLeft),
    marginRight: neg(cardPaddingRight),
    borderTopLeftRadius: cardBorderRadius,
    borderTopRightRadius: cardBorderRadius,
  },
  bottom: {
    marginBottom: neg(cardPaddingBottom),
    marginLeft: neg(cardPaddingLeft),
    marginRight: neg(cardPaddingRight),
    borderBottomLeftRadius: cardBorderRadius,
    borderBottomRightRadius: cardBorderRadius,
  },
  left: {
    marginLeft: neg(cardPaddingLeft),
    borderTopLeftRadius: cardBorderRadius,
    borderBottomLeftRadius: cardBorderRadius,
  },
  right: {
    marginRight: neg(cardPaddingRight),
    borderTopRightRadius: cardBorderRadius,
    borderBottomRightRadius: cardBorderRadius,
  },
});

// Declared after `side` so its rule wins on equal specificity when
// `padding-box` flattens the per-side rounding above.
export const clip = styleVariants({
  'border-box': {},
  'padding-box': { borderRadius: 'unset' },
});
