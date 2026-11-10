import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./format";

/**
 * Runs an async loader on mount (and whenever `deps` change), tracking
 * loading/error state and ignoring results that arrive after unmount.
 */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const run = useRef(0);

  const reload = useCallback(async () => {
    const id = ++run.current;
    setLoading(true);
    setError("");
    try {
      const result = await loaderRef.current();
      if (id === run.current) setData(result);
    } catch (cause) {
      if (id === run.current) setError(errorMessage(cause, "Something went wrong while loading."));
    } finally {
      if (id === run.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return () => {
      run.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loading, error, reload };
}
