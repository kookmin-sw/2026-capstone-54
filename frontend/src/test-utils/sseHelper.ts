export class FakeSseStream {
  url: string = "";
  onMessage: ((event: string, data: unknown) => void) | null = null;
  onError: ((err: Error) => void) | null = null;
  shouldReconnect: (() => boolean) | null = null;
  cancelCalled = false;
  callCount = 0;

  emit(event: string, data: unknown): void {
    this.onMessage?.(event, data);
  }

  emitError(err: Error): void {
    this.onError?.(err);
  }

  triggerReconnectCheck(): boolean {
    return this.shouldReconnect?.() ?? true;
  }

  reset(): void {
    this.url = "";
    this.onMessage = null;
    this.onError = null;
    this.shouldReconnect = null;
    this.cancelCalled = false;
    this.callCount = 0;
  }
}

interface OpenSseOptions {
  shouldReconnect?: () => boolean;
  onError?: (err: Error) => void;
}

type OpenSseFn = (
  url: string,
  onMessage: (event: string, data: unknown) => void,
  options?: OpenSseOptions,
) => () => void;

export function makeSseStreamMock(): { stream: FakeSseStream; mock: jest.Mock<ReturnType<OpenSseFn>, Parameters<OpenSseFn>> } {
  const stream = new FakeSseStream();
  const mock = jest.fn<ReturnType<OpenSseFn>, Parameters<OpenSseFn>>((url, onMessage, options) => {
    stream.url = url;
    stream.onMessage = onMessage;
    stream.onError = options?.onError ?? null;
    stream.shouldReconnect = options?.shouldReconnect ?? null;
    stream.callCount++;
    return () => {
      stream.cancelCalled = true;
    };
  });
  return { stream, mock };
}
