export function makeAbortable<T>(promiseFactory: (signal: AbortSignal) => Promise<T>) {
  let controller: AbortController | null = null;

  const run = () => {
    controller?.abort();
    controller = new AbortController();
    return promiseFactory(controller.signal);
  };

  const abort = () => {
    controller?.abort();
  };

  return { run, abort };
}
