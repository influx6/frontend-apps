import { useRef } from "react";

export function useAsyncGuard() {
  const lockRef = useRef(false);

  return async function <T>(fn: () => Promise<T | void>) {
    if (lockRef.current) return;
    lockRef.current = true;
    try {
      return await fn();
    } finally {
      lockRef.current = false;
    }
  };
}
