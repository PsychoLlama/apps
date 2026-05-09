/* eslint-disable solid/no-innerhtml -- the SVG markup is built locally
 * from trusted icon bodies; no untrusted input ever reaches innerHTML. */

import type { Component } from 'solid-js';
import { renderIconSvg } from '../svg';
import type { IconEditorState } from '../state';
import * as css from './preview.css';

interface PreviewProps {
  /** Reactive icon state to render. */
  state: IconEditorState;
  /** Rendered display size in CSS pixels. */
  size: number;
  /**
   * Pulse the canvas while an icon resolution is in flight (initial
   * URL hydration, randomize). The blueprint placeholder or stale
   * icon stays visible underneath. @default false
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
  return (
    // The preview is a fixed-size SVG container; the size depends on
    // `props.size`, so the inline style is genuinely dynamic.
    // eslint-disable-next-line custom/require-ui-primitives
    <div
      class={className()}
      style={{ width: `${props.size}px`, height: `${props.size}px` }}
      aria-label={`Icon preview at ${props.size} pixels`}
      aria-busy={props.loading ? true : undefined}
      innerHTML={svg()}
    />
  );
};
