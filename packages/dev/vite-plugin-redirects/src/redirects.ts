import {
  assertCompatible,
  compileMatcher,
  compileTemplate,
} from '@lib/url-pattern/cloudflare';
import type { Plugin } from 'vite';
import { PLUGIN_NAME } from './constants.ts';
import type { RedirectRule, RedirectsApi } from './api/index.ts';

/** Options for {@link redirects}. */
export interface RedirectsConfig {
  /** In match order: Cloudflare applies the first that matches. */
  rules: RedirectRule[];
}

/**
 * Vite plugin that writes Cloudflare's `_redirects` into the build
 * output. Dev serves no redirects.
 */
export const redirects = (config: RedirectsConfig): Plugin<RedirectsApi> => {
  config.rules.forEach(compileRule);

  const api: RedirectsApi = {
    getRules: () => structuredClone(config.rules),
  };

  return {
    name: PLUGIN_NAME,
    apply: 'build',
    api,

    // Lands at the site root with the rest of the browser bundle.
    applyToEnvironment: (environment) =>
      environment.config.consumer === 'client',

    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: api.getRules().map(formatRule).join(''),
      });
    },
  };
};

const formatRule = (rule: RedirectRule) => `${rule.join(' ')}\n`;

// Fails the config on rules Cloudflare would drop or fill wrong, naming
// the rule, since the underlying errors only see one half of it.
const compileRule = (rule: RedirectRule) => {
  const [source, destination] = rule;

  try {
    const matcher = compileMatcher({ pathname: source });
    const template = compileTemplate(destination);
    assertCompatible(matcher, template);

    return [matcher, template] as const;
  } catch (error) {
    throw new Error(`Invalid redirect: ${rule.join(' ')}`, { cause: error });
  }
};
