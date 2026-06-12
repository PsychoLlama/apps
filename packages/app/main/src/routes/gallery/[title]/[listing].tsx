import { ListingView, findListing } from '@app/gallery';
import { Text } from '@lib/ui';
import { useParams } from '@solidjs/router';
import { Show, Suspense, lazy } from 'solid-js';
import { Dynamic } from 'solid-js/web';

/**
 * Renders the gallery listing named by the `title`/`listing` route params.
 * Both arrive percent-encoded, so they're decoded before lookup. Code-splits
 * the listing module behind `<Suspense>`; an unknown title or listing falls
 * back to a not-found message.
 */
export default function GalleryListingRoute() {
  const params = useParams<{ title: string; listing: string }>();

  const loaded = () => {
    const name = decodeURIComponent(params.listing);
    const load = findListing(decodeURIComponent(params.title), name);
    if (!load) return undefined;

    return lazy(() =>
      load().then((module) => ({
        default: () => <ListingView name={name} listing={module.default} />,
      })),
    );
  };

  return (
    <Suspense
      fallback={
        <Text as="p" size={2} color="lowContrast">
          Loading…
        </Text>
      }
    >
      <Show
        when={loaded()}
        fallback={
          <Text as="p" size={2} color="lowContrast">
            No such listing.
          </Text>
        }
      >
        {(component) => <Dynamic component={component()} />}
      </Show>
    </Suspense>
  );
}
