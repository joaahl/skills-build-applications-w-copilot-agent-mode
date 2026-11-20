import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'success'; items: T[] }
  | { status: 'error'; message: string };

type Props<T> = {
  title: string;
  description: string;
  path: string;
  responseKey: string;
  emptyMessage: string;
  controls?: ReactNode;
  renderItems: (items: T[]) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, responseKey, emptyMessage, controls, renderItems }: Props<T>) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    getJson<Record<string, T[]>>(path)
      .then((response) => {
        if (!response || !Array.isArray(response[responseKey])) {
          throw new Error('Invalid response from the server');
        }
        if (active) setState({ status: 'success', items: response[responseKey] });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: 'error', message: error instanceof Error ? error.message : 'Unexpected error' });
        }
      });
    return () => { active = false; };
  }, [path, responseKey]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {controls}
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}: {state.message}</p>}
        {state.status === 'success' && (state.items.length === 0
          ? <p>{emptyMessage}</p>
          : renderItems(state.items))}
      </div>
    </section>
  );
}
