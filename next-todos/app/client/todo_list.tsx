"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TodoData } from "../models/todo";
import { Todo } from "./todo";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

const ITEM_HEIGHT = 48;
const BUFFER = 3;

interface VirtualTodoListProps {
  tasks: TodoData[];
  container_height: number;
  load_previous?: () => Promise<void>;
  load_next?: () => Promise<void>;
  on_change: (todo: TodoData) => void;
}

export function VirtualTodoList({
  tasks,
  container_height,
  on_change,
  load_next,
  load_previous,
}: VirtualTodoListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const loadingRef = useRef(false);

  // Previous task list, used to measure how the sliding window shifted.
  const prevTasksRef = useRef<TodoData[]>(tasks);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, []);

  // Keep the viewport anchored on the same items when the window slides.
  // Items are fixed height, so the scroll delta is exactly the number of items
  // added/removed *above* the viewport × ITEM_HEIGHT. Derived from the task
  // diff (not a height snapshot) so it stays correct with virtualization and
  // client-side tab/search filtering.
  useLayoutEffect(() => {
    const prev = prevTasksRef.current;
    prevTasksRef.current = tasks;

    const container = containerRef.current;
    if (!container || prev.length === 0 || tasks.length === 0) return;

    // Front of the window unchanged → nothing was added/removed above us.
    if (prev[0].id === tasks[0].id) return;

    // loadPrevious prepended a batch: the old first item moved down the list.
    const prepended = tasks.findIndex((t) => t.id === prev[0].id);
    if (prepended > 0) {
      container.scrollTop += prepended * ITEM_HEIGHT;
      return;
    }

    // loadNext evicted the front batch: the new first item lived further down
    // the old list. Scroll up by its height so the viewport doesn't stay glued
    // to the bottom (which would immediately re-fire the bottom sentinel).
    const evicted = prev.findIndex((t) => t.id === tasks[0].id);
    if (evicted > 0) {
      container.scrollTop -= evicted * ITEM_HEIGHT;
    }
    // Otherwise (tab switch / search / reset) there's no shared anchor — leave
    // the scroll position alone.
  }, [tasks]);

  // Wrapped load functions with loading guard
  const handleLoadPrevious = () => {
    if (loadingRef.current || !load_previous) return;
    loadingRef.current = true;
    load_previous().finally(() => {
      loadingRef.current = false;
    });
  };

  const handleLoadNext = () => {
    if (loadingRef.current || !load_next) return;
    loadingRef.current = true;
    load_next().finally(() => {
      loadingRef.current = false;
    });
  };

  // Virtualization math
  const totalHeight = tasks.length * ITEM_HEIGHT;
  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const endIndex = Math.min(tasks.length, startIndex + visibleCount);
  const visibleTasks = tasks.slice(startIndex, endIndex);
  const paddingTop = startIndex * ITEM_HEIGHT;
  const paddingBottom = (tasks.length - endIndex) * ITEM_HEIGHT;

  // IntersectionObserver sentinels
  const topRef = useIntersectionObserver(
    containerRef,
    (entry) => {
      if (entry.isIntersecting) handleLoadPrevious();
    },
    { rootMargin: "200px 0px 0px 0px" },
  );

  const bottomRef = useIntersectionObserver(
    containerRef,
    (entry) => {
      if (entry.isIntersecting) handleLoadNext();
    },
    { rootMargin: "0px 0px 200px 0px" },
  );

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{ maxHeight: `${container_height}px`, overflowAnchor: "auto" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* Top sentinel */}
      <div ref={topRef} style={{ height: "1px" }} />

      {/* Virtual list */}
      <div style={{ height: totalHeight }}>
        <div style={{ paddingTop, paddingBottom }}>
          {visibleTasks.map((task) => (
            <Todo key={task.id} data={task} on_change={on_change} />
          ))}
        </div>
      </div>

      {/* Bottom sentinel */}
      <div ref={bottomRef} style={{ height: "1px" }} />
    </div>
  );
}
