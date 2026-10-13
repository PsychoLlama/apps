import type { NitroModule } from 'nitro/types';

/**
 * Nitro module that prerenders the `/404` route as `/404.html` at the
 * assets root, for Cloudflare's `not_found_handling = "404-page"`. Add it
 * to `modules` in the app's nitro config.
 */
export const pageNotFound = (): NitroModule => ({
  name: 'page-not-found',
  setup(nitro) {
    // Prerendering spins up a second nitro instance from the same config,
    // so this runs twice. Only the outer build writes the output.
    if (nitro.options.preset === 'nitro-prerender') return;

    // Cloudflare serves `/404` itself; no page links to it, so the crawler
    // can't reach it.
    nitro.hooks.hook('prerender:routes', (routes) => {
      routes.add('/404');
    });

    // Cloudflare looks for a file literally named `404.html`. Nitro's
    // default autoSubfolderIndex would emit `/404/index.html`; rename just
    // this one route so the rest of the site keeps pretty URLs.
    nitro.hooks.hook('prerender:generate', (route) => {
      if (route.route === '/404') {
        route.fileName = '/404.html';
      }
    });
  },
});
