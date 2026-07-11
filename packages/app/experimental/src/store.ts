import { createStore, defineAction, defineStore } from '@lib/state';
import type {
  FloatingAlignment,
  FloatingSide,
} from '@lib/ui/_internal/floating-ui';

/** Placement inputs driving the floating window in the scratchpad. */
export interface FloatingControlsState {
  /** Anchor edge the window binds to. */
  side: FloatingSide;
  /** Horizontal placement relative to the pin. */
  justify: FloatingAlignment;
  /** Vertical placement relative to the pin. */
  align: FloatingAlignment;
}

const floatingControlsStore = defineStore<FloatingControlsState>(() => ({
  side: 'bottom',
  justify: 'center',
  align: 'start',
}));

/** Live, readonly view of the floating-window placement controls. */
export const floatingControls = createStore(floatingControlsStore);

/** Bind the window to a different edge of the anchor. */
export const setSide = defineAction(
  [floatingControlsStore],
  (controls, side: FloatingSide) => {
    controls.side = side;
  },
);

/** Set the window's horizontal placement. */
export const setJustify = defineAction(
  [floatingControlsStore],
  (controls, justify: FloatingAlignment) => {
    controls.justify = justify;
  },
);

/** Set the window's vertical placement. */
export const setAlign = defineAction(
  [floatingControlsStore],
  (controls, align: FloatingAlignment) => {
    controls.align = align;
  },
);
