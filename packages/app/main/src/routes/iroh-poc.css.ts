import { style } from '@vanilla-extract/css';
import {
  accent,
  fontFamily,
  neutral,
  radius,
  space,
  typeScale,
} from '@lib/design';

export const idCode = style({
  fontFamily: fontFamily.code,
  fontSize: typeScale[1].fontSize,
  padding: `${space[1]} ${space[2]}`,
  borderRadius: radius[2],
  background: neutral.solid[3],
  border: `1px solid ${neutral.solid[5]}`,
  wordBreak: 'break-all',
});

export const messageList = style({
  width: '100%',
  minHeight: space[7],
  maxHeight: '320px',
  padding: space[3],
  borderRadius: radius[3],
  background: neutral.solid[2],
  border: `1px solid ${neutral.solid[5]}`,
  overflowY: 'auto',
  // Honor `scrollIntoView` and scrollTop writes triggered by the
  // auto-scroll effect without yanking the page when the list is
  // already pinned to the bottom.
  scrollBehavior: 'smooth',
});

// Long peer ids and badges shouldn't push the session header past
// the viewport on mobile — `min-width: 0` lets the column shrink
// below its content's intrinsic width inside its row-flex parent.
export const sessionHeaderInfo = style({
  minWidth: 0,
});

// 64-char hex peer ids have no natural break points, so the browser
// won't wrap them without an explicit hint.
export const peerIdFull = style({
  wordBreak: 'break-all',
});

const messageRow = style({
  maxWidth: '80%',
});

export const messageRowMe = style([messageRow, { alignSelf: 'flex-end' }]);
export const messageRowPeer = style([messageRow, { alignSelf: 'flex-start' }]);
export const messageRowSystem = style({
  alignSelf: 'center',
  maxWidth: '90%',
});

const messageBubble = style({
  padding: `${space[2]} ${space[3]}`,
  borderRadius: radius[3],
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
});

export const messageBubbleMe = style([
  messageBubble,
  {
    background: accent.solid[9],
    color: accent.contrast,
  },
]);

export const messageBubblePeer = style([
  messageBubble,
  {
    background: neutral.solid[4],
    color: neutral.solid[12],
  },
]);

export const messageBubbleSystem = style([
  messageBubble,
  {
    background: 'transparent',
    fontStyle: 'italic',
    fontSize: typeScale[1].fontSize,
    color: neutral.solid[11],
    textAlign: 'center',
  },
]);
