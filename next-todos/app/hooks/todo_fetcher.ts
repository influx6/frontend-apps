"use client";

import { useRef, useState } from "react";
import TodoData from "../models/todo";
import { loadTodos } from "../server/actions";
import { useAsyncGuard } from "./async_guard";

type FetchTodos = (tab?: "pending" | "completed" | "new") => Promise<void>;

interface FetchWindow {
  batchSize: number;
  prevCursor: number | null;
  nextCursor: number | null;
}

type FetchReset = (FetchWindow: FetchWindow, initialTodo: TodoData[]) => void;

/*
 * useTodoFetcher — sliding window over server-side paginated data.
 *
 * Strategy:
 *   • Server returns batches of N items with prevCursor/nextCursor for navigation.
 *   • Client keeps MAX_BATCHES (3) windows in memory at all times.
 *   • Going next:  append new batch at the end, evict oldest from the front.
 *   • Going previous: prepend batch at the front, evict newest from the back.
 *   • windows[0].prevCursor always points to the batch before the current window,
 *     whether that batch is still in memory or was evicted — no extra state needed.
 *
 * Window lifecycle:
 *   Initial     →  [batch-0]                    items: 0..19
 *   next × 2    →  [batch-0, batch-1, batch-2]  items: 0..59
 *   next        →  evict batch-0, load batch-3  items: 20..79
 *   previous    →  load from windows[0].prevCursor (=0), evict batch-3
 *                  items: 0..59
 */
export function useTodoFetcher(
  initial: FetchWindow,
  initialTodos: TodoData[],
): [TodoData[], FetchTodos, FetchTodos, FetchReset] {
  const MAX_BATCHES = 3;
  const sendRequest = useAsyncGuard();

  // Active windows — each entry describes one loaded batch and its cursors.
  // windows[0].prevCursor always points to the batch before the current window.
  const windows = useRef<FetchWindow[]>([initial]);

  // Index of the first item in todos[] within the full sorted list.
  // Used to determine if prevCursor points to data we already have.
  const windowStart = useRef(0);

  const [todos, setTodos] = useState(initialTodos);

  // resets fetch window back to start
  const fetchReset: FetchReset = (new_window, newTodos) => {
    windows.current = [new_window];
    windowStart.current = 0;
    setTodos(newTodos);
  };

  /**
   * Load the previous batch (scroll up / backward in the list).
   *
   * If under MAX_BATCHES: prepend the new batch without eviction.
   * At MAX_BATCHES: evict the newest batch from the back, prepend the
   * batch fetched from evictedPrevCursor (the oldest batch we dropped).
   */
  const fetchPreviousWindow: FetchTodos = async (tab) => {
    await sendRequest<void>(async () => {
      if (windows.current.length < MAX_BATCHES) {
        const first = windows.current[0];
        if (!first.prevCursor) return;
        const result = await loadTodos(first.prevCursor, tab);

        // dont fire if items are not returned
        // if (!result || result.items.length === 0) return;

        setTodos((prev) => [...result.items, ...prev]);
        windows.current = [
          { batchSize: result.batchSize, prevCursor: result.prevCursor, nextCursor: result.nextCursor },
          ...windows.current,
        ];
        return;
      }

      // At capacity — evict newest from back, prepend batch from windows[0].prevCursor
      const loadCursor = windows.current[0].prevCursor;
      // Don't load if prevCursor points to data already in our window
      if (loadCursor === null || loadCursor >= windowStart.current) {
        return;
      }

      const result = await loadTodos(loadCursor, tab);
      // dont fire if items are not returned
      // if (!result || result.items.length === 0) return;

      const second = windows.current[1];
      const keepCount = second.batchSize * (MAX_BATCHES - 1);
      setTodos((prev) => [...result.items, ...prev.slice(0, keepCount)]);
      windowStart.current = loadCursor;
      windows.current = [
        { batchSize: result.batchSize, prevCursor: result.prevCursor, nextCursor: result.nextCursor },
        ...windows.current.slice(0, MAX_BATCHES - 1),
      ];
    });
  };

  /**
   * Load the next batch (scroll down / forward in the list).
   *
   * If under MAX_BATCHES: append the new batch without eviction.
   * At MAX_BATCHES: evict the oldest batch from the front, append the
   * batch fetched from the last window's nextCursor.
   */
  const fetchNextWindow: FetchTodos = async (tab) => {
    await sendRequest<void>(async () => {
      const last = windows.current[windows.current.length - 1];
      if (!last.nextCursor) return;

      if (windows.current.length < MAX_BATCHES) {
        const result = await loadTodos(last.nextCursor, tab);

        // dont fire if items are not returned
        // if (!result || result.items.length === 0) return;

        setTodos((prev) => [...prev, ...result.items]);
        windows.current = [
          ...windows.current,
          { batchSize: result.batchSize, prevCursor: result.prevCursor, nextCursor: result.nextCursor },
        ];
        return;
      }

      // At capacity — evict oldest from front, load next
      const oldest = windows.current[0];

      const result = await loadTodos(last.nextCursor, tab);

      // dont fire if items are not returned
      // if (!result || result.items.length === 0) return;

      // Evict the oldest batch from the front, append the freshly loaded one.
      setTodos((prev) => [...prev.slice(oldest.batchSize), ...result.items]);
      windowStart.current += oldest.batchSize;
      windows.current = [
        ...windows.current.slice(1),
        { batchSize: result.batchSize, prevCursor: result.prevCursor, nextCursor: result.nextCursor },
      ];
    });
  };

  return [todos, fetchPreviousWindow, fetchNextWindow, fetchReset];
}
