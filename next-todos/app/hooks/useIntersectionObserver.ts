"use client";

import { useEffect, useRef, useState } from "react";

type ObserverCallback = (entry: IntersectionObserverEntry) => void;

/**
 * Observe a sentinel element inside a scroll container.
 *
 * @param rootRef   ref to the scroll container used as the observer root
 * @param callback  invoked with the entry whenever the intersection changes
 * @param options   IntersectionObserver options (`root` is taken from rootRef)
 * @returns a ref callback to attach to the sentinel element
 *
 * The sentinel is tracked as state so the effect re-runs once it mounts. By the
 * time the effect runs (commit phase, after all refs are attached) the parent
 * container's ref is guaranteed to be set, so the observer always has a root.
 */
export function useIntersectionObserver(
  rootRef: React.RefObject<HTMLElement | null>,
  callback: ObserverCallback,
  options?: Omit<IntersectionObserverInit, "root">,
): React.RefCallback<HTMLElement | null> {
  const callbackRef = useRef(callback);

  const [element, setElement] = useState<HTMLElement | null>(null);

  const rootMargin = options?.rootMargin;
  const threshold = options?.threshold;

  useEffect(() => {
    const root = rootRef.current;
    if (!element || !root) return;

    const observer = new IntersectionObserver(([entry]) => callbackRef.current(entry), {
      root,
      rootMargin,
      threshold,
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [element, rootRef, rootMargin, threshold]);

  return setElement;
}
