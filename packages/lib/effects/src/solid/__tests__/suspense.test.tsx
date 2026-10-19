import { render, screen } from '@solidjs/testing-library';
import {
  createResource,
  createSignal,
  onCleanup,
  type Component,
  type JSX,
} from 'solid-js';
import { DEFAULT_CONTROLLER } from '../../controller/default';
import { EffectsContext, useMounted } from '../context';
import { Suspense } from '../suspense';

/** Render under a context whose `mounted` flag the test flips by hand. */
const renderUnmounted = (tree: () => JSX.Element) => {
  const [mounted, setMounted] = createSignal(false);
  const effects = { controller: DEFAULT_CONTROLLER, mounted };

  render(() => (
    <EffectsContext.Provider value={effects}>{tree()}</EffectsContext.Provider>
  ));

  return { mount: () => setMounted(true) };
};

/** Suspends on a client-side resource until `gate` resolves. */
const loader = (gate: Promise<string>): Component =>
  vi.fn(() => {
    const [value] = createResource(useMounted(), () => gate);
    return <p>{value()}</p>;
  });

describe('Suspense', () => {
  it('keeps one fallback from pre-render until the children resolve', async () => {
    const gate = Promise.withResolvers<string>();
    const disposed = vi.fn();
    const Fallback: Component = vi.fn(() => {
      onCleanup(disposed);
      return <p>loading</p>;
    });
    const Content = loader(gate.promise);

    const tree = renderUnmounted(() => (
      <Suspense fallback={<Fallback />}>
        <Content />
      </Suspense>
    ));

    const placeholder = screen.getByText('loading');
    expect(Content).not.toHaveBeenCalled();

    tree.mount();

    expect(screen.getByText('loading')).toBe(placeholder);
    expect(disposed).not.toHaveBeenCalled();
    expect(Content).toHaveBeenCalledOnce();

    gate.resolve('ready');

    expect(await screen.findByText('ready')).toBeInTheDocument();
    expect(placeholder).not.toBeInTheDocument();
    expect(Fallback).toHaveBeenCalledOnce();
  });

  it('swaps the prerender for the fallback on mount', async () => {
    const gate = Promise.withResolvers<string>();
    const disposed = vi.fn();
    const Prerender = () => {
      onCleanup(disposed);
      return <p>static</p>;
    };
    const Fallback: Component = vi.fn(() => <p>loading</p>);
    const Content = loader(gate.promise);

    const tree = renderUnmounted(() => (
      <Suspense fallback={<Fallback />} prerender={<Prerender />}>
        <Content />
      </Suspense>
    ));

    expect(screen.getByText('static')).toBeInTheDocument();
    expect(Fallback).not.toHaveBeenCalled();

    tree.mount();

    expect(screen.queryByText('static')).not.toBeInTheDocument();
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(disposed).toHaveBeenCalledOnce();

    gate.resolve('ready');

    expect(await screen.findByText('ready')).toBeInTheDocument();
  });

  it('renders children straight away when nothing suspends', () => {
    const tree = renderUnmounted(() => (
      <Suspense fallback={<p>loading</p>}>
        <p>ready</p>
      </Suspense>
    ));

    tree.mount();

    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
  });
});
