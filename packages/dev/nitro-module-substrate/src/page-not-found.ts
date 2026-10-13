import type { Nitro } from 'nitro/types';

/**
 * Prerenders the `/404` route as `/404.html` at the assets root, for
 * Cloudflare's `not_found_handling = "404-page"`.
 */
export const pageNotFound = (nitro: Nitro) => {
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
};
