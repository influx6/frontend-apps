import { useEffect, useRef, useState } from "react";
import TodoData from "../models/todo";
import { Todo } from "./todo";

interface VirtualTodoListProps {
  tasks: TodoData[];
  container_height: number;
  on_change: (todo: TodoData) => void;
}

const ITEM_HEIGHT = 48; // fixed height per row in pixels
const BUFFER = 3; // how much extra items to render below visible area

/*

Imagine you have 10,000 todos, each 48px tall, in a container that's 400px tall.

---
totalHeight = tasks.length * ITEM_HEIGHT

10,000 items × 48px = 480,000px (480kb of scroll space)

This is the fake full height — the height the scroll bar thinks exists. Without this, the scroll bar would only be as tall as the rendered items (~15 items = 720px), and you'd hit the bottom immediately. This tells the browser "pretend there are 10,000 items here."

---
startIndex = Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER

This finds which item index is at the top of the visible area.

When you scroll down 960px:
960 / 48 = 20 → item #20 is at the top of the viewport

The - BUFFER (which is 3) means we start rendering 3 items before the visible area. So we actually start at item #17. Why? So when you scroll up slightly, those items are already rendered — no flash of blank space. It's a pre-render buffer.

Math.max(0, ...) ensures we never go below index 0.

---
visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER * 2

This is how many items to render at once.

400px container / 48px per item = 8.33 → ceil = 9 items fit on screen
+ BUFFER * 2 (3 above + 3 below) = 9 + 6 = 15 items total

So even with 10,000 todos, we only ever render 15 DOM nodes. The 3 above and 3 below are the pre-render buffers in both directions.

---
endIndex = Math.min(tasks.length, startIndex + visibleCount)

This is the last item index to render.

startIndex (17) + visibleCount (15) = 32

So we render items 17 through 31 (slice is exclusive on the end).

Math.min(tasks.length, ...) ensures we never go past the last item. If you're at the bottom of the list and there are only 5 items left to render, it caps at the actual length.

---
visibleTasks = tasks.slice(startIndex, endIndex)

This extracts the actual data for the items we're rendering. Instead of mapping over all 10,000 items, we slice out just items 17-31 — 15 items. This is the core performance win.

---
paddingTop = startIndex * ITEM_HEIGHT

This pushes the rendered items down to the correct scroll position.

startIndex (17) × 48px = 816px of padding on top

Without this, item #17 would render at the very top of the container, even though the user has scrolled down 960px. The paddingTop says "skip the first 17 items worth of space" so item #17 appears where it should — at the top of the visible area.

---
paddingBottom = (tasks.length - endIndex) * ITEM_HEIGHT

This fills the space below the rendered items.

(10,000 - 32) × 48px = 478,464px of padding on bottom

This pushes the content up so the scroll bar stays at the correct position. Without it, after rendering 15 items, the container would be "done" and the scroll bar would jump to the bottom.

---
The full picture visually:

┌──────────────────────────────────────────┐ ← top of container
│                                          │
│   paddingTop: 816px (items 0-16 "here") │
│                                          │
│ ┌──────────────────────────────────────┐ │ ← viewport starts here
│ │ Item 17 (first visible)              │ │
│ │ Item 18                              │ │
│ │ Item 19                              │ │
│ │ Item 20  user sees these            │ │
│ │ Item 21                              │ │
│ │ Item 22                              │ │
│ │ Item 23                              │ │
│ │ Item 24                              │ │
│ │ Item 25                              │ │
│ │ Item 26                              │ │
│ │ Item 27                              │ │
│ │ Item 28                              │ │
│ │ Item 29                              │ │
│ │ Item 30                              │ │
│ │ Item 31 (last visible + buffer)      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ paddingBottom: 478,464px (items 32-9999)│
│                                          │
└──────────────────────────────────────────┘ ← bottom of container

15 DOM nodes. Not 10,000. The scrollbar thinks the full list is there because totalHeight + padding creates the right scroll space.

*/

export function VirtualTodoList({ tasks, container_height, on_change }: VirtualTodoListProps) {
  const container_ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!container_ref.current) {
      return;
    }
    setContainerHeight(container_ref.current.clientHeight);
  }, []);

  const totalHeight = tasks.length * ITEM_HEIGHT; // items * height of each item
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER * 2;
  const endIndex = Math.min(tasks.length, startIndex + visibleCount);
  const visibleTasks = tasks.slice(startIndex, endIndex);

  const paddingTop = startIndex * ITEM_HEIGHT;
  const paddingBottom = (tasks.length - endIndex) * ITEM_HEIGHT;

  return (
    <div
      ref={container_ref}
      className="overflow-y-auto"
      style={{ maxHeight: `${container_height}px` }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ paddingTop, paddingBottom }}>
          {visibleTasks.map((task) => (
            <Todo key={task.id} data={task} on_change={on_change} />
          ))}
        </div>
      </div>
    </div>
  );
}
