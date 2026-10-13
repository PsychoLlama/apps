import { environment } from '@lib/runtime-config';
import { Show } from 'solid-js';

/**
 * Cloudflare Web Analytics site tokens, one per domain. Subdomains share
 * their domain's token. Public: they ship in the HTML.
 */
const SITE_TOKENS = {
  'psychollama.io': '98e18ae3a5df400fb420d6b9442918c0',
} as const;

export interface RealUserMeasurementsProps {
  /** The domain the page is served under, without subdomains. Picks the site token. */
  domain: keyof typeof SITE_TOKENS;
}

/**
 * Cloudflare's Real User Measurements beacon: page load timings and Core
 * Web Vitals, no user tracking. Render it at the end of `<body>`.
 *
 * Cloudflare can inject this itself, but only into pages fetched as
 * `text/html`, so pages a service worker caches would ship without it,
 * and rewritten HTML no longer matches its integrity hash. Turn off
 * automatic injection for any host that renders this: a page can only
 * run one beacon.
 *
 * Production builds only. Staging previews and dev would report into the
 * same site, or be rejected outside the domain.
 *
 * @see https://developers.cloudflare.com/web-analytics/get-started/#sites-not-proxied-through-cloudflare
 */
export const RealUserMeasurements = (props: RealUserMeasurementsProps) => (
  <Show when={environment === 'production'}>
    <script
      type="module"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: SITE_TOKENS[props.domain] })}
    />
  </Show>
);
