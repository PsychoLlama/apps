import { Show, createMemo, onCleanup, type Component } from 'solid-js';
import { Flex, Heading, Text } from '@lib/ui';
import IconPreviewOff from 'virtual:icons/mdi/file-question-outline';
import * as css from './preview.css';

interface PreviewProps {
  /** The selected file, or `undefined` while metadata is still loading. */
  file: File | undefined;
}

/**
 * MIME types the browser handles natively in an iframe — images
 * render in the image viewer, PDFs in Chromium's PDF viewer, audio
 * and video in their respective elements, JSON/XML get the dev
 * formatter. Files matching this set are passed through as-is.
 */
const PASSTHROUGH_MIME = /^(image|audio|video)\/|^application\/(pdf|json|xml)$/;

/**
 * Extensions for text-format files we'll re-wrap as `text/plain` so
 * the iframe renders inline. Chromium reports an empty `File.type`
 * for most of these because its built-in MIME map doesn't cover
 * markdown / yaml / config / source code; without a coercion to a
 * MIME the browser knows how to render, the iframe would fire a
 * download instead.
 */
const TEXT_EXTENSIONS = new Set([
  'md',
  'markdown',
  'mdx',
  'rst',
  'txt',
  'log',
  'lock',
  'yaml',
  'yml',
  'toml',
  'ini',
  'conf',
  'config',
  'env',
  'sh',
  'bash',
  'zsh',
  'fish',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'swift',
  'c',
  'cpp',
  'cc',
  'cxx',
  'h',
  'hpp',
  'ts',
  'tsx',
  'jsx',
  'mjs',
  'cjs',
  'js',
  'css',
  'scss',
  'sass',
  'less',
  'styl',
  'lua',
  'nix',
  'pl',
  'php',
  'ex',
  'exs',
  'clj',
  'scala',
  'sql',
  'graphql',
  'gql',
  'csv',
  'tsv',
  'html',
  'htm',
  'svg',
]);

/** Filenames with no extension that are conventionally text. */
const TEXT_BASENAMES = new Set([
  'dockerfile',
  'makefile',
  'cmakelists.txt',
  'license',
  'readme',
  'authors',
  'contributors',
  'changelog',
  'codeowners',
  'gitignore',
  'gitattributes',
  'editorconfig',
  'env',
]);

const getExtension = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
};

/** True when an extension or basename signals a renderable text file. */
const looksLikeText = (name: string): boolean => {
  const lower = name.toLowerCase();
  if (TEXT_BASENAMES.has(lower)) return true;
  // `.gitignore` and friends parse as having a leading dot — slice
  // strips it so the basename set matches.
  if (lower.startsWith('.') && TEXT_BASENAMES.has(lower.slice(1))) return true;
  return TEXT_EXTENSIONS.has(getExtension(lower));
};

/**
 * Build the iframe source for a selected file. Returns `undefined`
 * for opaque binary formats Chromium would only download. Text-format
 * files are re-wrapped as `text/plain` so the browser renders them
 * inline; the wrapper Blob references the original lazily, so this
 * costs nothing until the iframe pulls bytes.
 */
const previewSource = (file: File): Blob | undefined => {
  const type = file.type;
  if (PASSTHROUGH_MIME.test(type)) return file;
  if (type === 'text/plain') return file;
  if (type.startsWith('text/')) return new Blob([file], { type: 'text/plain' });
  if (!type && looksLikeText(file.name)) {
    return new Blob([file], { type: 'text/plain' });
  }
  return undefined;
};

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
    if (!props.file) return undefined;
    const source = previewSource(props.file);
    if (!source) return undefined;
    return URL.createObjectURL(source);
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
