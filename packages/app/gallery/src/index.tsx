import { Container, Flex, Heading, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import { For } from 'solid-js';

/**
 * A package's contribution to the gallery. Packages export one as the default
 * of their `src/manifest.gallery.ts`; `@app/main` discovers them with a
 * build-time glob and hands the collected set to {@link Gallery}.
 */
export interface GalleryManifest {
  /** Display name for the entry. Conventionally the package's name. */
  title: string;
}

export interface GalleryProps {
  /** Discovered package manifests, one per gallery-enabled package. */
  manifests: GalleryManifest[];
}

export const Gallery = (props: GalleryProps) => {
  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Gallery" />

      <Container as="section" size={2} px={5} py={6}>
        <Flex as="div" direction="column" gap={5}>
          <Flex as="hgroup" direction="column" gap={3}>
            <Heading as="h1" size={7} trim="start">
              Hello, world
            </Heading>
            <Text as="p" size={3} color="lowContrast">
              The gallery is just getting started. Component and token browsing
              lands here soon.
            </Text>
          </Flex>

          <Flex as="ul" direction="column" gap={2}>
            <For each={props.manifests}>
              {(manifest) => (
                <Flex as="li">
                  <Text as="span" size={3} selectable={false}>
                    {manifest.title}
                  </Text>
                </Flex>
              )}
            </For>
          </Flex>
        </Flex>
      </Container>
    </Flex>
  );
};
