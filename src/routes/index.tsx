import SiteHeader from '../components/site-header';
import * as css from './index.css';

export default function Launcher() {
  return (
    <div class={css.page}>
      <SiteHeader title="Apps" />
      <div class={css.content}>
        <div class={css.column}>
          <h1 class={css.heading}>Apps</h1>

          <div class={css.list}>
            <a href="/studio" class={css.link}>
              <span class={css.indicator} />
              <div class={css.appInfo}>
                <span class={css.appName}>Recording Studio</span>
                <span class={css.appDescription}>
                  Record your screen from the browser
                </span>
              </div>
            </a>

            <a href="/favicon" class={css.link}>
              <span class={css.indicator} />
              <div class={css.appInfo}>
                <span class={css.appName}>Favicon Generator</span>
                <span class={css.appDescription}>
                  Create favicons from free icon sets
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
