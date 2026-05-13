import { act } from "@testing-library/react";

interface ZustandLike<S> {
  setState: (partial: Partial<S>) => void;
  getState: () => S;
}

export function resetZustand<S>(store: ZustandLike<S>, initial: Partial<S>): void {
  act(() => {
    store.setState(initial);
  });
}

export function snapshotZustand<S>(store: ZustandLike<S>): S {
  return store.getState();
}
