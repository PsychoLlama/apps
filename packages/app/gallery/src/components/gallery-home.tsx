import { For } from 'solid-js';
import { Card, Container, Flex, Grid, Heading, Link, Text } from '@lib/ui';
import { manifestLinks } from '../manifests';
import { GalleryView } from './gallery-view';
import * as css from './gallery-home.css';

/** The gallery landing page: one card per manifest, linking to its own page. */
export const GalleryHome = () => (
  <GalleryView trail={[{ label: 'Gallery' }]}>
    <Container as="div" size={3}>
      <Flex as="header" direction="column" gap={2}>
        <Heading as="h1" size={7} selectable>
          Gallery
        </Heading>
        <Text as="p" size={3} color="lowContrast" selectable>
          Interactive view of the component library and design system.
          Foundations were ported from{' '}
          <Link
            href="https://www.radix-ui.com/"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            testId="radix-credit"
          >
            Radix UI
          </Link>
          .
        </Text>
        <Text as="p" size={3} color="lowContrast" selectable>
          All code is{' '}
          <Link
            href="https://github.com/PsychoLlama/apps"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            testId="source-credit"
          >
            available on GitHub
          </Link>
          .
        </Text>
      </Flex>
      <Grid as="ul" gap={4} class={css.grid} aria-label="Manifests">
        <For each={manifestLinks}>
          {(manifest) => (
            <Flex as="li" direction="column">
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
      </Grid>
    </Container>
  </GalleryView>
);
