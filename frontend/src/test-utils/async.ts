import { act } from "@testing-library/react";

export async function flushMicrotasks(turns = 3): Promise<void> {
  await act(async () => {
    for (let i = 0; i < turns; i++) {
      await Promise.resolve();
    }
  });
}

export async function swallowRejection<T>(promise: Promise<T>): Promise<unknown> {
  try {
    await promise;
    return null;
  } catch (e) {
    return e;
  }
}
