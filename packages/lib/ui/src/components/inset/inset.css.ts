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

export const side = styleVariants({
  all: {
    margin: `${neg(cardPaddingTop)} ${neg(cardPaddingRight)} ${neg(cardPaddingBottom)} ${neg(cardPaddingLeft)}`,
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
  },
  bottom: {
    marginBottom: neg(cardPaddingBottom),
    marginLeft: neg(cardPaddingLeft),
    marginRight: neg(cardPaddingRight),
  },
  left: {
    marginLeft: neg(cardPaddingLeft),
  },
  right: {
    marginRight: neg(cardPaddingRight),
  },
});

export const clip = styleVariants({
  'border-box': { borderRadius: cardBorderRadius },
  'padding-box': {},
});
