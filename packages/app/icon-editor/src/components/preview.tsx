/* eslint-disable solid/no-innerhtml -- the SVG markup is built locally
 * from trusted icon bodies; no untrusted input ever reaches innerHTML. */

import type { Component, JSX } from 'solid-js';
import { renderIconSvg } from '../svg';
import type { IconEditorShape, IconEditorState } from '../state';
import * as css from './preview.css';

/**
 * `border-radius` for the skeleton placeholder, in percentages so the
 * computed pixel radius scales with the live frame size. Mirrors the
 * `SHAPE_RX_RATIO` table in `svg.ts` (which feeds the SVG clip-path
 * during normal renders) — keep them in sync if the shape values
 * change, so the skeleton block reads as the same canvas the icon
 * will land in.
 */
const SKELETON_RADIUS: Record<IconEditorShape, string> = {
  square: '0',
  rounded: '18%',
  squircle: '32%',
  circle: '50%',
};

interface PreviewProps {
  /** Reactive icon state to render. */
  state: IconEditorState;
  /** Rendered display size in CSS pixels. */
  size: number;
  /**
   * Render a skeleton placeholder in place of the SVG while an icon
   * resolution is in flight (initial URL hydration, randomize). The
   * placeholder picks up the active shape's radius so the loading
   * affordance reads as the canvas the icon will land in. @default false
   */
  loading?: boolean;
}

/** Live preview of the current icon at an arbitrary display size. */
export const Preview: Component<PreviewProps> = (props) => {
  const svg = () =>
    renderIconSvg(props.state, {
      responsive: true,
      // The display size is unique per Preview on the page (hero +
      // size strip), so it doubles as a stable id discriminator that
      // keeps each preview's `clip-path` ref pointing at its own clip.
      idSuffix: `preview-${props.size}`,
    });
  const className = () =>
    props.loading ? `${css.frame} ${css.loading}` : css.frame;
  const style = (): JSX.CSSProperties => ({
    width: `${props.size}px`,
    height: `${props.size}px`,
    'border-radius': props.loading
      ? SKELETON_RADIUS[props.state.shape]
      : undefined,
  });
  return (
    // The preview is a fixed-size SVG container; the size depends on
    // `props.size`, so the inline style is genuinely dynamic.
    // eslint-disable-next-line custom/require-ui-primitives
    <div
      class={className()}
      style={style()}
      aria-label={`Icon preview at ${props.size} pixels`}
      aria-busy={props.loading ? true : undefined}
      innerHTML={props.loading ? '' : svg()}
    />
  );
};
