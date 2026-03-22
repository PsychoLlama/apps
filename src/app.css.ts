import { globalStyle, style } from '@vanilla-extract/css';

globalStyle('body', {
  fontFamily:
    "Gordita, Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
});

globalStyle('a', {
  marginRight: '1rem',
});

globalStyle('main', {
  textAlign: 'center',
  padding: '1em',
  margin: '0 auto',
});

globalStyle('h1', {
  color: '#335d92',
  textTransform: 'uppercase',
  fontSize: '4rem',
  fontWeight: 100,
  lineHeight: 1.1,
  margin: '4rem auto',
  maxWidth: '14rem',
  '@media': {
    '(min-width: 480px)': {
      maxWidth: 'none',
    },
  },
});

globalStyle('p', {
  maxWidth: '14rem',
  margin: '2rem auto',
  lineHeight: 1.35,
  '@media': {
    '(min-width: 480px)': {
      maxWidth: 'none',
    },
  },
});

export const increment = style({
  fontFamily: 'inherit',
  fontSize: 'inherit',
  padding: '1em 2em',
  color: '#335d92',
  backgroundColor: 'rgba(68, 107, 158, 0.1)',
  borderRadius: '2em',
  border: '2px solid rgba(68, 107, 158, 0)',
  outline: 'none',
  width: '200px',
  fontVariantNumeric: 'tabular-nums',
  cursor: 'pointer',
  selectors: {
    '&:focus': {
      border: '2px solid #335d92',
    },
    '&:active': {
      backgroundColor: 'rgba(68, 107, 158, 0.2)',
    },
  },
});
