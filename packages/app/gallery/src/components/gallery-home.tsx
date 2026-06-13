import { For } from 'solid-js';
import { Card, Container, Flex, Heading, Text } from '@lib/ui';
import { manifestLinks } from '../listings';
import { GalleryView } from './gallery-view';
import * as css from './gallery-home.css';

/** The gallery landing page: one card per manifest, linking to its own page. */
export const GalleryHome = () => (
  <GalleryView trail={[{ label: 'Gallery' }]}>
    <Container as="div" size={2}>
      <Flex as="ul" direction="column" gap={3} aria-label="Manifests">
        <For each={manifestLinks}>
          {(manifest) => (
            <Flex as="li">
              <Card
                as="a"
                href={manifest.href}
                testId={`manifest-${manifest.slug}`}
                size={3}
                class={css.card}
              >
                <Flex as="div" direction="column" gap={1}>
                  <Heading as="h2" size={3} weight="medium" selectable={false}>
                    {manifest.title}
                  </Heading>
                  <Text
                    as="p"
                    size={2}
                    color="lowContrast"
                    trim="end"
                    selectable={false}
                  >
                    {manifest.description}
                  </Text>
                </Flex>
              </Card>
            </Flex>
          )}
        </For>
      </Flex>
    </Container>
  </GalleryView>
);
