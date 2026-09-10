import { defineFold, defineStore, defineTopic } from '@lib/state';
import { scratchpadScope } from './scope';

/** A box's extent, in px. */
export interface Room {
  width: number;
  height: number;
}

/** What the tether reported back, as opposed to what it was told. */
export interface FloatingMeasurementState {
  /**
   * Room left for the surface inside the boundary, from the `size`
   * middleware. `null` until `size` has run.
   */
  available: Room | null;
}

/** Live, readonly view of the tether's last measurements. */
export const floatingMeasurement = defineStore<FloatingMeasurementState>(
  scratchpadScope,
  () => ({ available: null }),
);

/**
 * `size` measured the room again. Folded field by field so a repeat of
 * the same numbers changes nothing — the clamp this feeds resizes the
 * surface, which re-runs the tether, which reports again.
 */
export const availableRoomChanged = defineTopic<Room>();
defineFold(availableRoomChanged, [floatingMeasurement], (measurement, room) => {
  if (measurement.available) {
    measurement.available.width = room.width;
    measurement.available.height = room.height;
  } else {
    measurement.available = { ...room };
  }
});
