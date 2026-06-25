import { useEffect, useRef, useState } from "react";
import TodoData from "../models/todo";
import { Todo } from "./todo";

const THRESHOLD = 200;
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
  const container_ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  // const [containerHeight, setContainerHeight] = useState(0);
  const currentScrollPosition = useRef(0);
  const isLoading = useRef(false);

  const currentTurn = useRef(0);

  // useEffect(() => {
  //   if (container_ref.current) {
  //     setContainerHeight(container_ref.current.clientHeight);
  //   }
  // }, []);

  // When items are prepended (loadPrevious), scroll down by their height
  // so the viewport stays on the content the user was reading.
  // const prevLengthRef = useRef(tasks.length);
  useEffect(() => {
    // if the task list truly has changed then set as false
    const diff = currentScrollPosition.current - tasks.length;
    if (diff < 0 && container_ref.current) {
      // Items were added to the front — scroll down to keep viewport stable
      container_ref.current.scrollTop -= diff * 4;
    }
    currentScrollPosition.current = tasks.length;
  }, [tasks]);

  const totalHeight = tasks.length * ITEM_HEIGHT;
  const visibleCount = Math.ceil(container_height / ITEM_HEIGHT) + BUFFER * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const endIndex = Math.min(tasks.length, startIndex + visibleCount);
  const visibleTasks = tasks.slice(startIndex, endIndex);
  const paddingTop = startIndex * ITEM_HEIGHT;
  const paddingBottom = (tasks.length - endIndex) * ITEM_HEIGHT;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;

    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - THRESHOLD;
    const nearTop = el.scrollTop <= 5 && currentTurn.current > 0;

    if (
      nearTop &&
      load_previous &&
      // if they truly go past this level then we can consider
      // to call previous
      (el.scrollTop < currentScrollPosition.current || el.scrollTop <= 5) &&
      currentTurn.current > 0
    ) {
      setScrollTop(el.scrollTop);

      return load_previous();
    }

    if (nearBottom && load_next && !isLoading.current) {
      console.log("Scroll position for next: ", el.scrollTop, currentScrollPosition, nearBottom);
      setScrollTop(el.scrollTop);
      currentScrollPosition.current = el.scrollTop;
      currentTurn.current += 1;
      isLoading.current = true;
      return load_next().then(() => (isLoading.current = false));
    }

    setScrollTop(el.scrollTop);
    currentScrollPosition.current = el.scrollTop;
  };

  return (
    <div
      ref={container_ref}
      className="overflow-y-scroll"
      style={{ height: `${container_height}px` }}
      onScroll={handleScroll}
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
