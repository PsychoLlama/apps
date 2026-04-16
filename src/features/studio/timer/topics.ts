import { defineTopic } from '#state';

/** Published every second while the UI is mounted. Only increments while running. */
export const tick = defineTopic();
