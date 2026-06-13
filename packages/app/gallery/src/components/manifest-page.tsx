import { Show, type JSX } from 'solid-js';
import { Flex, Heading, Text } from '@lib/ui';
import type { GalleryManifest } from '@dev/gallery';
import { findManifest } from '../listings';
import { GalleryView } from './gallery-view';

/**
 * A manifest's page: its breadcrumb (`Gallery › <manifest>`, with `Gallery`
 * linking back to the landing page) over every listing it contributes. The
 * manifest resolves synchronously from its slug — an unknown slug keeps the raw
 * segment in the crumb and falls back to a not-found body. `renderListings`
 * supplies the async body; the router owns the `lazy`/`Suspense` load (it has
 * the SolidStart server deps that async/server boundaries need).
 */
export const ManifestPage = (props: {
  slug: string;
  renderListings: (manifest: GalleryManifest) => JSX.Element;
}) => {
  const manifest = () => findManifest(props.slug);

  return (
    <GalleryView
      trail={[
        { label: 'Gallery', href: '/gallery' },
        { label: manifest()?.title ?? props.slug },
      ]}
    >
      <Show
        when={manifest()}
        keyed
        fallback={
          <Text as="p" size={2} color="lowContrast" selectable={false}>
            No such manifest.
          </Text>
        }
      >
        {(found) => (
          <Flex as="div" direction="column" gap={6}>
            <Heading as="h1" size={7} weight="bold" selectable={false}>
              {found.title}
            </Heading>

            {props.renderListings(found)}
          </Flex>
        )}
      </Show>
    </GalleryView>
  );
};
