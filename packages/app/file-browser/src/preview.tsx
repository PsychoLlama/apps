import {
  Match,
  Show,
  Switch,
  createMemo,
  onCleanup,
  type Component,
} from 'solid-js';
import { Flex, Heading, Text } from '@lib/ui';
import IconPreviewOff from 'virtual:icons/mdi/file-question-outline';
import * as css from './preview.css';

interface PreviewProps {
  /** The selected file, or `undefined` while metadata is still loading. */
  file: File | undefined;
}

/**
 * MIME types the browser handles natively in an iframe — images
 * render in the image viewer, audio/video in their elements, JSON/XML
 * get the dev formatter. Files matching this set are passed through
 * as-is. PDFs are handled by a dedicated `<embed>` path because the
 * Chromium PDF viewer doesn't bootstrap inside `sandbox=""` (it needs
 * same-origin treatment for its UI assets).
 */
const PASSTHROUGH_MIME = /^(image|audio|video)\/|^application\/(json|xml)$/;

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
 * `'iframe'` paths render in a `sandbox=""` iframe (safe for
 * arbitrary HTML/SVG/text — scripts can't execute). `'embed'` paths
 * render via `<embed type="application/pdf">`, which always
 * dispatches to Chromium's PDF viewer regardless of byte contents,
 * sidestepping the sandbox-vs-PDF-viewer interaction.
 */
type PreviewKind = 'iframe' | 'embed';

interface PreparedPreview {
  blob: Blob;
  kind: PreviewKind;
}

/**
 * Build the source for a selected file. Returns `undefined` for opaque
 * binary formats Chromium would only download. Text-format files are
 * re-wrapped as `text/plain` and PDFs as `application/pdf` so the
 * browser always reaches the right renderer; the wrapper Blob
 * references the original lazily, so this costs nothing until the
 * frame pulls bytes.
 */
const preparePreview = (file: File): PreparedPreview | undefined => {
  const type = file.type;
  const ext = getExtension(file.name);

  // PDF gets its own renderer. Coerce the MIME so files Chromium
  // failed to identify by extension still land in the PDF viewer.
  if (type === 'application/pdf' || ext === 'pdf') {
    return {
      blob: new Blob([file], { type: 'application/pdf' }),
      kind: 'embed',
    };
  }

  if (PASSTHROUGH_MIME.test(type)) return { blob: file, kind: 'iframe' };
  if (type === 'text/plain') return { blob: file, kind: 'iframe' };
  if (type.startsWith('text/')) {
    return {
      blob: new Blob([file], { type: 'text/plain' }),
      kind: 'iframe',
    };
  }
  if (!type && looksLikeText(file.name)) {
    return {
      blob: new Blob([file], { type: 'text/plain' }),
      kind: 'iframe',
    };
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
  const prepared = createMemo<PreparedPreview | undefined>(() =>
    props.file ? preparePreview(props.file) : undefined,
  );
  const previewUrl = createMemo<string | undefined>((prev) => {
    if (prev) URL.revokeObjectURL(prev);
    const source = prepared();
    return source ? URL.createObjectURL(source.blob) : undefined;
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
          <Switch>
            <Match when={prepared()?.kind === 'embed'}>
              <embed
                src={url}
                type="application/pdf"
                title={title()}
                class={css.frame}
              />
            </Match>
            <Match when={prepared()?.kind === 'iframe'}>
              <iframe src={url} sandbox="" title={title()} class={css.frame} />
            </Match>
          </Switch>
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
