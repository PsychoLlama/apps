import { ListingHeading, ListingView, findListing } from '@app/gallery';
import { Flex, Text } from '@lib/ui';
import { useParams } from '@solidjs/router';
import { Show, Suspense, lazy } from 'solid-js';
import { Dynamic } from 'solid-js/web';

/**
 * Renders the gallery listing under the `title`/`listing` route params —
 * `title` is a manifest slug, `listing` a percent-encoded listing name. The
 * heading renders immediately from the param; the listing module is code-split
 * behind `<Suspense>` so only its body waits on the load. An unknown title or
 * listing falls back to a not-found message.
 */
export default function GalleryListingRoute() {
  const params = useParams<{ title: string; listing: string }>();
  const name = () => decodeURIComponent(params.listing);

  const body = () => {
    const load = findListing(params.title, name());
    if (!load) return undefined;

    return lazy(() =>
      load().then((module) => ({
        default: () => <ListingView listing={module.default} />,
      })),
    );
  };

  return (
    <Flex as="div" direction="column" gap={6}>
      <ListingHeading name={name()} />

      <Suspense>
        <Show
          when={body()}
          fallback={
            <Text as="p" size={2} color="lowContrast" selectable={false}>
              No such listing.
            </Text>
          }
        >
          {(component) => <Dynamic component={component()} />}
        </Show>
      </Suspense>
    </Flex>
  );
}
