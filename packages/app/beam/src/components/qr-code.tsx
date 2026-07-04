import { Flex } from '@lib/ui';
import type { QrGrid } from '../state/session';
import * as styles from './qr-code.css';

/**
 * Flatten a grid into one SVG path, merging each row's dark cells into
 * horizontal runs so the path carries one segment per run rather than one per
 * module. Every module is a 1×1 cell in the code's own coordinate space (the
 * SVG's `viewBox` scales it to the rendered size).
 */
const buildPath = (grid: QrGrid): string => {
  const { size, modules } = grid;
  let path = '';

  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!modules[row * size + col]) {
        col++;
        continue;
      }
      const start = col;
      while (col < size && modules[row * size + col]) col++;
      const run = col - start;
      path += `M${start} ${row}h${run}v1h-${run}z`;
    }
  }

  return path;
};

/**
 * Paint a QR module grid as a crisp, self-scaling SVG on a fixed light plate.
 * The grid already carries its quiet zone, so the plate's padding is breathing
 * room, not scan margin. `label` names the code for assistive tech.
 */
export const QrCode = (props: { grid: QrGrid; label: string }) => (
  <Flex as="figure" class={styles.plate}>
    <svg
      class={styles.canvas}
      viewBox={`0 0 ${props.grid.size} ${props.grid.size}`}
      role="img"
      aria-label={props.label}
      shape-rendering="crispEdges"
    >
      <path d={buildPath(props.grid)} fill="currentColor" />
    </svg>
  </Flex>
);
