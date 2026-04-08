import { Show } from 'solid-js';
import * as css from './site-header.css';

function Logo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.15" />
      <path
        d="M7 8h10M7 12h6M7 16h8"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
  );
}

export default function SiteHeader(props: { title?: string }) {
  return (
    <header class={css.header}>
      <a href="/" class={css.logoLink}>
        <Logo />
      </a>
      <Show when={props.title}>
        <span class={css.divider} />
        <span class={css.title}>{props.title}</span>
      </Show>
    </header>
  );
}
