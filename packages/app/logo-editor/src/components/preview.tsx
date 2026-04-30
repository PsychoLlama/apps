/* eslint-disable solid/no-innerhtml -- the SVG markup is built locally
 * from trusted icon bodies; no untrusted input ever reaches innerHTML. */

import type { Component } from 'solid-js';
import { renderLogoSvg } from '../svg';
import type { LogoEditorState } from '../state';
import * as css from './preview.css';

interface PreviewProps {
  /** Reactive logo state to render. */
  state: LogoEditorState;
  /** Rendered display size in CSS pixels. */
  size: number;
}

/** Live preview of the current logo at an arbitrary display size. */
export const Preview: Component<PreviewProps> = (props) => {
  const svg = () =>
    renderLogoSvg(props.state, {
      responsive: true,
      // The display size is unique per Preview on the page (hero +
      // size strip), so it doubles as a stable id discriminator that
      // keeps each preview's `clip-path` ref pointing at its own clip.
      idSuffix: `preview-${props.size}`,
    });
  return (
    // The preview is a fixed-size SVG container; the size depends on
    // `props.size`, so the inline style is genuinely dynamic.
    // eslint-disable-next-line custom/require-ui-primitives
    <div
      class={css.frame}
      style={{ width: `${props.size}px`, height: `${props.size}px` }}
      aria-label={`Logo preview at ${props.size} pixels`}
      innerHTML={svg()}
    />
  );
};
