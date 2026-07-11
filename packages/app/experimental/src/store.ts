import { createStore, defineAction, defineStore } from '@lib/state';
import type {
  ArrowAlign,
  FloatingAlignment,
  FloatingSide,
} from '@lib/ui/_internal/floating-ui';

/** Placement inputs driving the floating window in the scratchpad. */
export interface FloatingControlsState {
  /** Anchor edge the window binds to. */
  side: FloatingSide;
  /** Placement along that edge. */
  align: FloatingAlignment;
  /** Placement of the arrow along that edge. */
  arrowAlign: ArrowAlign;
}

const floatingControlsStore = defineStore<FloatingControlsState>(() => ({
  side: 'bottom',
  align: 'center',
  arrowAlign: 'center',
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

/** Set the window's placement along the bound edge. */
export const setAlign = defineAction(
  [floatingControlsStore],
  (controls, align: FloatingAlignment) => {
    controls.align = align;
  },
);

/** Set the arrow's placement along the bound edge. */
export const setArrowAlign = defineAction(
  [floatingControlsStore],
  (controls, arrowAlign: ArrowAlign) => {
    controls.arrowAlign = arrowAlign;
  },
);
