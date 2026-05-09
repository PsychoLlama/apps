import { Show, createMemo, onCleanup, type Component } from 'solid-js';
import { Flex, Heading, Text } from '@lib/ui';
import IconPreviewOff from 'virtual:icons/mdi/file-question-outline';
import * as css from './preview.css';

interface PreviewProps {
  /** The selected file, or `undefined` while metadata is still loading. */
  file: File | undefined;
}

/**
 * MIME types we'll hand to the iframe. The browser dispatches each
 * to its own renderer (image viewer, PDF viewer, plain-text panel,
 * media element). Anything not in this set falls back to the "no
 * preview" placeholder so we don't trigger an inadvertent download
 * for binary types Chromium doesn't know how to render.
 */
const PREVIEWABLE =
  /^(image|text|audio|video)\/|^application\/(pdf|json|xml|javascript|x-yaml)$/;

const isPreviewable = (type: string | undefined): boolean =>
  type !== undefined && PREVIEWABLE.test(type);

/**
 * Sandboxed-iframe file preview. The selected `File` is exposed as a
 * blob URL and handed to an iframe with `sandbox=""` (empty
 * allowlist) so HTML/SVG content can't run scripts in our origin.
 *
 * Lifecycle: `createMemo` revokes the prior blob URL on each change
 * so we don't leak references; `onCleanup` revokes the final URL on
 * unmount. The iframe internally references the URL by string, so
 * revoking after a switch is safe — the browser keeps the blob alive
 * for the iframe's loaded document.
 */
export const Preview: Component<PreviewProps> = (props) => {
  const previewUrl = createMemo<string | undefined>((prev) => {
    if (prev) URL.revokeObjectURL(prev);
    if (!props.file || !isPreviewable(props.file.type)) return undefined;
    return URL.createObjectURL(props.file);
  });
  onCleanup(() => {
    const final = previewUrl();
    if (final) URL.revokeObjectURL(final);
  });

  const title = () => `Preview of ${props.file?.name ?? 'selection'}`;

  return (
    <Flex as="section" direction="column" gap={2}>
      <Heading as="h3" size={2} trim="both" selectable={false}>
        Preview
      </Heading>
      <Show
        when={previewUrl()}
        keyed
        fallback={<NoPreview file={props.file} />}
      >
        {(url) => (
          <iframe src={url} sandbox="" title={title()} class={css.frame} />
        )}
      </Show>
    </Flex>
  );
};

const NoPreview: Component<{ file: File | undefined }> = (props) => {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      justify="center"
      gap={2}
      class={css.noPreview}
    >
      <IconPreviewOff width="32" height="32" aria-hidden />
      <Text as="span" size={2} color="lowContrast" selectable={false}>
        No inline preview for {props.file?.type || 'this file type'}
      </Text>
    </Flex>
  );
};
