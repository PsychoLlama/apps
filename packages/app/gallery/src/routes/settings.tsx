import { Container, Flex, Heading, Text } from '@lib/ui';
import {
  LogFilterSettings,
  MotionSettings,
  ThemeSettings,
} from '@app/settings/components';
import { GalleryView } from '../components/gallery-view';

/** The gallery's settings page. */
const GallerySettings = () => (
  <GalleryView trail={[{ label: 'Settings' }]}>
    <Container as="div" size={2}>
      <Flex as="div" direction="column" gap={5}>
        <Flex as="header" direction="column" gap={2}>
          <Heading as="h1" size={6} weight="medium" selectable={false}>
            Settings
          </Heading>
          <Text as="p" size={2} color="lowContrast" selectable={false}>
            Tune how the gallery looks and behaves.
          </Text>
        </Flex>

        <ThemeSettings />
        <MotionSettings />

        <Flex as="section" direction="column" gap={5}>
          <Heading as="h2" size={5} weight="medium" selectable={false}>
            Advanced
          </Heading>

          <LogFilterSettings />

          {/* TODO: Add `LogStorageSettings` once the gallery installs a
              service worker. Its export is served by one. */}
        </Flex>
      </Flex>
    </Container>
  </GalleryView>
);

export default GallerySettings;
